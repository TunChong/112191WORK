(() => {
  'use strict';

  const ROUTE = 'qlst_checklist';
  const TABLE = 'qlst_checklist_items';
  const PAGE = 60;
  const PRIORITY = {high: 'Ưu tiên cao', normal: 'Bình thường', low: 'Ưu tiên thấp'};
  const RANK = {high: 0, normal: 1, low: 2};
  const ROLE = {manager: 'QLST', shift_lead: 'TC'};
  const TABS = {todo: 'Cần làm', done: 'Hoàn tất', overdue: 'Quá hạn'};
  const TZ = 'Asia/Ho_Chi_Minh';
  const dateTime = new Intl.DateTimeFormat('vi-VN', {timeZone: TZ, dateStyle: 'short', timeStyle: 'short'});
  const dateForm = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const inputDateTime = ms => dateForm.format(ms).replace(' ', 'T');
  const dayOf = ms => inputDateTime(ms).slice(0, 10);
  const utcTime = value => new Date(value + ':00+07:00').toISOString();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const person = (name, code) => name + (code ? ' · ' + code : '');
  const order = (a, b) => RANK[a.priority] - RANK[b.priority] || Date.parse(a.due_at) - Date.parse(b.due_at);
  const now = c => Date.now() + c.clockOffset;
  const reminderKey = row => [row.id, Date.parse(row.due_at), row.remind_minutes].join('|');

  let scope = null;

  function active(c) { return scope === c && !c.denied; }

  function changeContext(config) {
    if (config && scope?.shop.id === config.shop.id && scope.userId === config.userId) return;
    if (scope) {
      clearInterval(scope.poll);
      clearTimeout(scope.syncTimer);
      clearTimeout(scope.reminderTimer);
      scope.client?.disconnect();
      scope.element.remove();
      scope.popup?.remove();
    }
    scope = null;
    if (!config) return;
    const element = document.createElement('section');
    element.className = 'panel qlst-checklist';
    element.setAttribute('aria-label', 'Checklist Công việc QLST');
    element.innerHTML = `
      <div class="qlst-head">
        <div><h2>Checklist Công việc QLST</h2><p data-qlst="shop"></p></div>
        <button type="button" class="btn qlst-add" data-qlst-action="add" disabled>＋ Thêm công việc</button>
      </div>
      <p class="qlst-connection" data-qlst="connection" aria-live="polite"></p>
      <div class="qlst-editor" data-qlst="editor" hidden></div>
      <div class="qlst-tabs" aria-label="Trạng thái công việc" data-qlst="tabs"></div>
      <div data-qlst="filters" hidden></div>
      <div data-qlst="results"></div>`;
    const c = {
      ...config, element, ready: false, denied: false, dormant: false, day: null, clockOffset: 0,
      pending: [], completed: [], members: [], reminders: new Map(), tried: new Set(),
      tab: 'todo', filters: {period: 'day', date: dayOf(Date.now()), role: '', person: ''},
      edit: null, historyKey: '', hasMore: false, page: 0, lastSync: 0, connected: false, epoch: 0,
    };
    scope = c;
    element.querySelector('[data-qlst="shop"]').textContent = c.shop.code + ' · ' + c.shop.name;
    element.addEventListener('click', event => onClick(c, event));
    element.addEventListener('submit', event => save(c, event));
    element.addEventListener('change', event => onFilter(c, event));
    c.popup = document.createElement('aside');
    c.popup.className = 'qlst-popup';
    c.popup.setAttribute('role', 'status');
    c.popup.hidden = true;
    c.popup.addEventListener('click', event => {
      if (!active(c)) return;
      const action = event.target.closest('[data-qlst-popup]')?.dataset.qlstPopup;
      if (!action) return;
      if (action === 'open') c.navigate();
      c.reminders.clear();
      paintPopup(c);
    });
    document.body.append(c.popup);
    c.poll = setInterval(() => {
      if (!active(c) || c.dormant || document.visibilityState !== 'visible') return;
      const stale = Date.now() - c.lastSync > (c.connected ? 120_000 : 18_000);
      if (dayOf(now(c)) !== c.day || stale) sync(c);
      else {
        if (c.element.isConnected && c.tab !== 'done') paint(c);
        paintPopup(c);
      }
    }, 15_000);
    paint(c);
    sync(c);
  }

  function anyError(c, error) {
    if (!active(c)) return;
    if (error.status === 401 || error.status === 403 || error.code === '42501') {
      c.denied = true;
      c.pending = [];
      c.completed = [];
      c.members = [];
      c.reminders.clear();
      closeEditor(c);
      c.client?.disconnect();
      paintPopup(c);
    }
    if (!c.ready && (error.status === 404 || ['PGRST202','PGRST205','42883','42P01'].includes(error.code))) c.dormant = true;
    c.error = c.denied ? 'Tài khoản cần quyền QLST hoặc TC ở siêu thị đang chọn.'
      : c.dormant ? 'Máy chủ chưa có migration Checklist. Hãy thử lại sau khi quản trị viên cài đặt.'
      : 'Chưa đồng bộ được checklist. Hãy thử lại.';
    paint(c);
  }

  async function connect(c) {
    const Client = window.QLSTRealtime?.RealtimeClient;
    if (!Client || !active(c) || c.client) return;
    const client = c.client = new Client(c.base + '/realtime/v1', {
      params: {apikey: c.key},
      accessToken: async () => active(c) ? c.getToken() : null,
    });
    try { await client.setAuth(); }
    catch {
      client.disconnect();
      c.client = null;
      return;
    }
    if (!active(c)) return;
    const channel = client.channel('qlst-checklist-' + c.shop.id);
    channel.on('postgres_changes', {
      event: '*', schema: 'public', table: TABLE, filter: 'shop_id=eq.' + c.shop.id,
    }, event => {
      const row = event.new;
      if (!active(c) || row?.shop_id !== c.shop.id) return;
      c.epoch++;
      if (row.completed_at) c.pending = c.pending.filter(item => item.id !== row.id);
      if (c.reminders.has(row.id) && (row.completed_at || !row.remind_minutes
          || Date.parse(c.reminders.get(row.id).due_at) !== Date.parse(row.due_at))) {
        c.reminders.delete(row.id);
        paintPopup(c);
      }
      // Data is re-read under RLS. Events only signal that this shop changed.
      scheduleSync(c);
    }).subscribe(status => {
      if (!active(c)) return;
      c.connected = status === 'SUBSCRIBED';
      if (c.connected) scheduleSync(c);
      paint(c);
    });
  }

  function scheduleSync(c) {
    clearTimeout(c.syncTimer);
    c.syncTimer = setTimeout(() => sync(c), 125);
  }

  function dateRange(filters) {
    const start = new Date(filters.date + 'T00:00:00Z');
    if (filters.period === 'month') start.setUTCDate(1);
    if (filters.period === 'week') start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
    const end = new Date(start);
    if (filters.period === 'month') end.setUTCMonth(end.getUTCMonth() + 1);
    else end.setUTCDate(end.getUTCDate() + (filters.period === 'week' ? 7 : 1));
    return [start, end].map(date => utcTime(date.toISOString().slice(0, 10) + 'T00:00'));
  }

  function read(c, query) {
    const params = new URLSearchParams(query);
    params.set('shop_id', 'eq.' + c.shop.id);
    return c.api('/rest/v1/' + TABLE + '?' + params);
  }

  async function readPending(c) {
    const rows = new Map();
    const limit = 250;
    for (let offset = 0; active(c); offset += limit) {
      const page = await read(c, new URLSearchParams({
        completed_at: 'is.null', order: 'due_at.asc,id.asc', limit, offset,
      }));
      for (const row of page) rows.set(row.id, row);
      if (page.length < limit) break;
    }
    return Array.from(rows.values());
  }

  function historyQuery(c) {
    const [from, until] = dateRange(c.filters);
    const query = new URLSearchParams({
      completed_at: 'gte.' + from, order: 'completed_at.desc,id.asc', limit: PAGE + 1, offset: c.page * PAGE,
    });
    query.append('completed_at', 'lt.' + until);
    if (c.filters.role) query.set('completed_role', 'eq.' + c.filters.role);
    if (c.filters.person) query.set('completed_by', 'eq.' + c.filters.person);
    return query;
  }

  async function sync(c) {
    if (!active(c) || c.dormant) return;
    if (c.syncing) { c.syncAgain = true; return; }
    c.syncing = true;
    try {
      if (!c.ready || c.day !== dayOf(now(c))) {
        const meta = await c.rpc('qlst_checklist_open', {p_shop_id: c.shop.id});
        if (!active(c)) return;
        const previous = c.day;
        c.day = meta.day;
        c.clockOffset = Date.parse(meta.server_now) - Date.now();
        c.members = meta.members;
        if (!previous || c.filters.date === previous) { c.filters.date = c.day; c.page = 0; }
        c.ready = true;
      }
      const history = c.tab === 'done' ? historyQuery(c) : null;
      const epoch = c.epoch;
      const [pending, completed] = await Promise.all([readPending(c), history ? read(c, history) : null]);
      if (!active(c)) return;
      if (epoch !== c.epoch) { c.syncAgain = true; return; }
      c.pending = pending;
      const byId = new Map(pending.map(row => [row.id, row]));
      for (const [id, notice] of c.reminders) {
        const row = byId.get(id);
        if (!row || Date.parse(row.due_at) !== Date.parse(notice.due_at) || !row.remind_minutes) c.reminders.delete(id);
      }
      if (history && c.tab === 'done' && String(historyQuery(c)) === String(history)) {
        c.completed = completed.slice(0, PAGE);
        c.hasMore = completed.length > PAGE;
        c.historyKey = String(history);
      }
      c.error = '';
      c.lastSync = Date.now();
      paintPopup(c);
      connect(c);
      scheduleReminder(c);
    } catch (error) { anyError(c, error); }
    finally {
      c.syncing = false;
      paint(c);
      if (c.syncAgain) { c.syncAgain = false; scheduleSync(c); }
    }
  }

  function pendingReminders(c) {
    const time = now(c);
    return c.pending.filter(row => row.remind_minutes > 0 && Date.parse(row.due_at) > time
      && !c.tried.has(reminderKey(row)));
  }

  function scheduleReminder(c) {
    clearTimeout(c.reminderTimer);
    if (!active(c) || !c.ready || c.claiming || document.visibilityState !== 'visible') return;
    const rows = pendingReminders(c);
    const next = rows.reduce((soon, row) => Math.min(soon, Date.parse(row.due_at) - row.remind_minutes * 60_000), Infinity);
    if (Number.isFinite(next)) {
      const delay = Math.min(86_400_000, Math.max(0, next - now(c) + 250));
      c.reminderTimer = setTimeout(() => claimReminders(c), delay);
    }
  }

  async function claimReminders(c) {
    if (!active(c) || c.claiming || document.visibilityState !== 'visible') return;
    const candidates = pendingReminders(c).filter(row => Date.parse(row.due_at) - row.remind_minutes * 60_000 <= now(c));
    if (!candidates.length) { scheduleReminder(c); return; }
    c.claiming = true;
    let retry = false;
    try {
      const claimed = await c.rpc('qlst_checklist_claim_due', {
        p_shop_id: c.shop.id, p_ids: candidates.map(row => row.id),
      });
      if (!active(c)) return;
      for (const row of candidates) c.tried.add(reminderKey(row));
      if (document.visibilityState !== 'visible') return;
      const pending = new Map(c.pending.map(row => [row.id, row]));
      for (const notice of claimed) {
        const due = Date.parse(notice.due_at);
        if (Date.parse(pending.get(notice.id)?.due_at) === due && due > now(c)) {
          c.reminders.set(notice.id, notice);
        }
      }
      paintPopup(c);
    } catch (error) { retry = true; anyError(c, error); }
    finally {
      c.claiming = false;
      if (retry && active(c)) c.reminderTimer = setTimeout(() => scheduleReminder(c), 15_000);
      else scheduleReminder(c);
    }
  }

  function paintPopup(c) {
    const box = c.popup;
    if (!box) return;
    const notices = active(c) && document.visibilityState === 'visible'
      ? Array.from(c.reminders.values()).filter(row => Date.parse(row.due_at) > now(c)) : [];
    box.hidden = !notices.length;
    box.innerHTML = notices.length ? `<strong>Sắp đến hạn · ${esc(c.shop.code)}</strong>
      <ul>${notices.map(row => `<li>${esc(row.title)} <time>${esc(dateTime.format(new Date(row.due_at)))}</time></li>`).join('')}</ul>
      <div class="qlst-actions"><button type="button" class="btn sm" data-qlst-popup="open">Mở checklist</button>
      <button type="button" class="btn sm outline" data-qlst-popup="close">Đóng</button></div>` : '';
  }

  function elapsed(ms) {
    const minutes = Math.floor(ms / 60_000);
    if (!minutes) return 'Dưới 1 phút';
    if (minutes < 60) return minutes + ' phút';
    if (minutes < 1440) return Math.floor(minutes / 60) + ' giờ ' + minutes % 60 + ' phút';
    return Math.floor(minutes / 1440) + ' ngày ' + Math.floor(minutes / 60) % 24 + ' giờ';
  }

  function itemCard(c, row) {
    const done = row.completed_at;
    const deadline = Date.parse(row.due_at);
    const overdue = !done && now(c) >= deadline;
    return `<article class="qlst-item" data-qlst-item="${esc(row.id)}">
      <div class="qlst-item-top"><h3>${esc(row.title)}</h3>
        <span class="qlst-badge qlst-priority-${esc(row.priority)}">${esc(PRIORITY[row.priority])}</span>
      </div>
      <div class="qlst-meta">
        <span>Hạn ${esc(dateTime.format(deadline))}</span>
        <span>Người tạo ${esc(person(row.created_name, row.created_code))}</span>
        ${row.assigned_name ? `<span>Phụ trách ${esc(person(row.assigned_name, row.assigned_code))}</span>` : ''}
        ${overdue ? `<span class="qlst-late">Trễ ${elapsed(now(c) - deadline).toLowerCase()}</span>` : ''}
        ${done ? `<span>${esc(ROLE[row.completed_role])} ${esc(person(row.completed_name, row.completed_code))} · ${esc(dateTime.format(new Date(done)))}</span>
          <span class="${row.completed_late ? 'qlst-late' : 'qlst-on-time'}">${row.completed_late ? 'Hoàn thành trễ' : 'Đúng hạn'}</span>` : ''}
      </div>
      ${done ? '' : `<div class="qlst-actions"><button type="button" class="btn sm outline" data-qlst-action="edit" data-id="${esc(row.id)}">Chỉnh</button>
        <button type="button" class="btn sm" data-qlst-action="finish" data-id="${esc(row.id)}" ${c.busy ? 'disabled' : ''}>Hoàn tất</button></div>`}
    </article>`;
  }

  function filters(c) {
    const host = c.element.querySelector('[data-qlst="filters"]');
    host.hidden = c.tab !== 'done';
    if (!host.childElementCount) {
      host.innerHTML = `<div class="qlst-filter">
        <label>Khoảng thời gian<select name="period" data-qlst-filter><option value="day">Theo ngày</option><option value="week">Theo tuần</option><option value="month">Theo tháng</option></select></label>
        <label>Ngày tham chiếu<input type="date" name="date" data-qlst-filter required></label>
        <label>Vai trò<select name="role" data-qlst-filter><option value="">Tất cả</option><option value="manager">QLST</option><option value="shift_lead">TC</option></select></label>
        <label>Người hoàn tất<select name="person" data-qlst-filter></select></label>
      </div>`;
    }
    const people = new Map(c.members.map(member => [member.user_id, person(member.full_name, member.employee_code)]));
    for (const row of c.completed) people.set(row.completed_by, person(row.completed_name, row.completed_code));
    if (c.filters.person && !people.has(c.filters.person)) people.set(c.filters.person, c.filteredPersonLabel);
    const personSelect = host.querySelector('[name="person"]');
    const options = '<option value="">Tất cả</option>' + Array.from(people, ([id, name]) =>
      `<option value="${esc(id)}">${esc(name)}</option>`).join('');
    if (personSelect.dataset.options !== options) {
      personSelect.innerHTML = options;
      personSelect.dataset.options = options;
    }
    for (const [name, value] of Object.entries(c.filters)) host.querySelector(`[name="${name}"]`).value = value;
  }

  function paint(c) {
    if (scope !== c) return;
    const view = c.element;
    view.querySelector('[data-qlst-action="add"]').disabled = !c.ready || !!c.denied || !!c.busy;
    view.querySelector('[data-qlst="connection"]').textContent = c.denied ? 'Quyền truy cập đã thay đổi'
      : c.error ? 'Lỗi đồng bộ' : c.connected ? 'Đồng bộ trực tiếp' : c.ready ? 'Đồng bộ định kỳ' : 'Đang tải';
    const [todo, overdue] = [[], []];
    for (const item of c.pending) (Date.parse(item.due_at) > now(c) ? todo : overdue).push(item);
    view.querySelector('[data-qlst="tabs"]').innerHTML = Object.entries(TABS).map(([id, label]) =>
      `<button type="button" aria-pressed="${c.tab === id}" data-qlst-action="tab" data-id="${id}">${label}
        ${id === 'done' ? '' : `<span>${id === 'todo' ? todo.length : overdue.length}</span>`}</button>`).join('');
    filters(c);
    let content = '';
    if (c.error) content = `<p class="qlst-feedback" role="alert">${esc(c.error)} ${c.denied ? '' : '<button type="button" class="btn sm outline" data-qlst-action="retry">Thử lại</button>'}</p>`;
    if (c.ready && !c.denied) {
      const loadingHistory = c.tab === 'done' && c.historyKey !== String(historyQuery(c));
      const rows = c.tab === 'done' ? c.completed : (c.tab === 'todo' ? todo : overdue).sort(order);
      if (loadingHistory) content += '<p class="qlst-feedback">Đang tải lịch sử…</p>';
      else if (!rows.length) content += '<p class="qlst-feedback">Không có công việc trong mục này.</p>';
      else content += rows.map(row => itemCard(c, row)).join('');
      if (c.tab === 'done' && !loadingHistory && (c.page > 0 || c.hasMore)) {
        content += `<div class="qlst-actions"><button type="button" class="btn sm outline" data-qlst-action="previous" ${c.page < 1 ? 'disabled' : ''}>Trang trước</button>
          <span>Trang ${c.page + 1}</span><button type="button" class="btn sm outline" data-qlst-action="next" ${!c.hasMore ? 'disabled' : ''}>Trang sau</button></div>`;
      }
    }
    view.querySelector('[data-qlst="results"]').innerHTML = content;
  }

  function openEditor(c, row = null) {
    c.edit = {id: row?.id || crypto.randomUUID(), revision: row?.revision ?? null};
    const editor = c.element.querySelector('[data-qlst="editor"]');
    const options = c.members.map(m => `<option value="${esc(m.user_id)}" ${m.user_id === row?.assigned_to ? 'selected' : ''}>
      ${esc(ROLE[m.shop_role])} · ${esc(person(m.full_name, m.employee_code))}</option>`).join('');
    editor.innerHTML = `<form data-qlst-form aria-label="${row ? 'Chỉnh công việc' : 'Thêm công việc'}">
      <h3>${row ? 'Chỉnh công việc' : 'Thêm công việc'}</h3>
      <div class="qlst-form-grid">
        <label class="qlst-full">Tên công việc<input name="title" required maxlength="160" value="${esc(row?.title)}" ${row?.daily_key ? 'readonly' : ''}></label>
        <label>Hạn hoàn tất<input type="datetime-local" name="deadline" required value="${inputDateTime(row ? Date.parse(row.due_at) : now(c) + 60 * 60_000)}"></label>
        <label>Mức ưu tiên<select name="priority">${Object.entries(PRIORITY).map(([value, title]) =>
          `<option value="${value}" ${value === (row?.priority ?? 'normal') ? 'selected' : ''}>${title}</option>`).join('')}</select></label>
        <label>Nhắc trước (phút, 0 để tắt)<input type="number" name="reminder" min="0" max="1440" required value="${row?.remind_minutes ?? 60}"></label>
        <label>Người phụ trách<select name="assignee"><option value="">Chưa chỉ định</option>${options}</select></label>
      </div>
      ${row?.daily_key ? '<label class="qlst-option"><input name="future" type="checkbox"> Dùng giờ, ưu tiên và nhắc việc này cho các ngày sau</label>' : ''}
      <p class="qlst-form-error" data-qlst="form-error" aria-live="polite"></p>
      <div class="qlst-actions"><button type="submit" class="btn">Lưu công việc</button><button type="button" class="btn outline" data-qlst-action="cancel">Hủy</button></div>
    </form>`;
    editor.hidden = false;
    editor.querySelector(row?.daily_key ? '[name="deadline"]' : '[name="title"]').focus();
  }

  function closeEditor(c) {
    c.edit = null;
    const host = c.element.querySelector('[data-qlst="editor"]');
    host.hidden = true;
    host.replaceChildren();
  }

  function updateFromWrite(c, result) {
    const row = result.item;
    c.epoch++;
    c.pending = c.pending.filter(item => item.id !== row.id);
    if (!row.completed_at) c.pending.push(row);
    c.reminders.delete(row.id);
    paintPopup(c);
    if (result.status === 'conflict') c.toast('Một người khác đã cập nhật công việc. Hãy kiểm tra thông tin mới trước khi thao tác lại.');
    scheduleSync(c);
    scheduleReminder(c);
    paint(c);
  }

  async function save(c, event) {
    if (!event.target.matches('[data-qlst-form]')) return;
    event.preventDefault();
    if (!active(c) || c.busy || !c.edit) return;
    const form = event.target;
    const fields = new FormData(form);
    const submit = form.querySelector('[type="submit"]');
    c.busy = true;
    submit.disabled = true;
    try {
      const result = await c.rpc('qlst_checklist_save', {
        p_shop_id: c.shop.id, p_id: c.edit.id, p_expected_revision: c.edit.revision,
        p_title: fields.get('title'), p_due_at: utcTime(fields.get('deadline')),
        p_priority: fields.get('priority'), p_remind_minutes: Number(fields.get('reminder')),
        p_assigned_to: fields.get('assignee') || null, p_apply_future: fields.has('future'),
      });
      if (!active(c)) return;
      closeEditor(c);
      updateFromWrite(c, result);
    } catch (error) {
      if (error.status === 401 || error.status === 403 || error.code === '42501') anyError(c, error);
      else if (active(c)) form.querySelector('[data-qlst="form-error"]').textContent = error.message || 'Không lưu được công việc.';
    } finally {
      c.busy = false;
      submit.disabled = false;
      paint(c);
    }
  }

  async function finish(c, row) {
    if (!row || c.busy) return;
    c.busy = true;
    paint(c);
    try {
      const result = await c.rpc('qlst_checklist_finish', {
        p_shop_id: c.shop.id, p_id: row.id, p_expected_revision: row.revision,
      });
      if (!active(c)) return;
      updateFromWrite(c, result);
      if (result.status === 'completed') c.toast('Đã chuyển công việc sang Hoàn tất.');
      if (result.status === 'already_completed') c.toast('Công việc đã được hoàn tất bởi ' + result.item.completed_name + '.');
    } catch (error) { anyError(c, error); }
    finally { c.busy = false; paint(c); }
  }

  function onClick(c, event) {
    const button = event.target.closest('[data-qlst-action]');
    if (!button || !active(c)) return;
    const {qlstAction: action, id} = button.dataset;
    if (action === 'retry') { c.dormant = false; sync(c); return; }
    if (action === 'tab' && Object.hasOwn(TABS, id)) { c.tab = id; paint(c); if (id === 'done') sync(c); return; }
    if (action === 'cancel') { if (!c.busy) closeEditor(c); return; }
    if (!c.ready || c.busy) return;
    if (action === 'add') openEditor(c);
    const row = c.pending.find(item => item.id === id);
    if (action === 'edit' && row) openEditor(c, row);
    if (action === 'finish') finish(c, row);
    if (action === 'previous' || action === 'next') {
      c.page = Math.max(0, c.page + (action === 'next' ? 1 : -1));
      paint(c);
      sync(c);
    }
  }

  function onFilter(c, event) {
    const input = event.target;
    if (!active(c) || !input.hasAttribute('data-qlst-filter') || !Object.hasOwn(c.filters, input.name) || !input.validity.valid) return;
    c.filters[input.name] = input.value;
    if (input.name === 'person') c.filteredPersonLabel = input.selectedOptions[0]?.textContent;
    c.page = 0;
    paint(c);
    sync(c);
  }

  document.addEventListener('visibilitychange', () => {
    if (!scope || !active(scope)) return;
    if (document.visibilityState === 'visible') {
      if (!scope.dormant) sync(scope);
    } else paintPopup(scope);
  });
  window.addEventListener('online', () => { if (scope && active(scope) && !scope.dormant) sync(scope); });

  window.QLSTChecklist = {
    route: ROUTE,
    setContext: changeContext,
    mount(host) {
      if (scope && host && scope.element.parentNode !== host) host.append(scope.element);
    },
  };
})();
