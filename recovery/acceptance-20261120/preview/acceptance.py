"""Companion MWG acceptance fixture. Every API write stays in this local process."""
import argparse
import base64
from datetime import datetime, timezone
import json
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from serve import Handler, ROOT, PROFILE, NOTES

OUT = ROOT / 'acceptance-evidence'
OUT.mkdir(exist_ok=True)
FIXTURE = {}


def now():
    return datetime.now(timezone.utc).isoformat()


def reset():
    FIXTURE.clear()
    FIXTURE.update(sessions={}, stock={}, counts={}, orders=[], tasks=[], notifications=[], quote_images=[], audio_requests=0)


reset()


class Acceptance(Handler):
    def do_GET(self):
        url = urlsplit(self.path)
        path = url.path
        query = parse_qs(url.query)

        def equal(key):
            return query.get(key, [''])[0].removeprefix('eq.')

        if path == '/qa/acceptance-state':
            return self.send(200, FIXTURE)
        if path in ('/stable/vietqr-payment.png', '/print/vietqr-payment.png', '/stable-before/vietqr-payment.png'):
            return self.send(200, (ROOT / 'qa/no-payment.png').read_bytes(), 'image/png')
        if path.startswith('/qa-api/rest/v1/'):
            table = path.rsplit('/', 1)[1]
            sid = equal('session_id')
            if table in ('inventory_sessions', 'inventory_imei_sessions'):
                rows = [r for r in FIXTURE['sessions'].values() if r['shop_id'] == equal('shop_id') and r['imei'] == ('imei' in table)]
                return self.send(200, rows[::-1])
            if table in ('inventory_stock', 'inventory_imei_expected'):
                return self.send(200, FIXTURE['stock'].get(sid, []))
            if table in ('inventory_counts', 'inventory_imei_scans'):
                return self.send(200, list(FIXTURE['counts'].get(sid, {}).values()))
            if table == 'companion_audio_orders':
                return self.send(200, FIXTURE['orders'][::-1])
            if table == 'tasks':
                return self.send(200, [r for r in FIXTURE['tasks'] if r['shop_id'] == equal('shop_id')])
            if table == 'notifications':
                return self.send(200, FIXTURE['notifications'] + NOTES)
        if path.startswith('/stable-before/'):
            return SimpleHTTPRequestHandler.do_GET(self)
        return super().do_GET()

    def do_POST(self):
        path = urlsplit(self.path).path
        if path == '/qa/acceptance-reset':
            reset()
            for note in NOTES:
                note['read_at'] = None
            return self.send(200, {'ok': True})
        if path == '/qa/acceptance-report':
            (OUT / 'browser.json').write_bytes(self.body())
            return self.send(200, {'ok': True})
        if path == '/qa/acceptance-new-task':
            task = dict(id='qa-priority', title='Việc gấp kiểm thử', description='Chi tiết nhiệm vụ giả', category='Kiểm tra', priority='high', shop_id='qa-a', created_at=now(), due_at='2027-01-01T08:00:00Z')
            FIXTURE['tasks'][:] = [task]
            FIXTURE['notifications'][:] = [dict(id='qa-priority-note', recipient_id=PROFILE['id'], task_id=task['id'], title='Việc gấp kiểm thử', body='Dữ liệu giả', created_at=now(), event_key='new:qa-priority', read_at=None)]
            return self.send(200, task)
        if path.startswith('/qa/acceptance-output/'):
            name = path.rsplit('/', 1)[-1]
            if re.fullmatch(r'[a-z0-9-]+\.(png|pdf|xlsx)', name):
                (OUT / name).write_bytes(self.body())
                return self.send(200, {'ok': True})
            return self.send(400, {'error': 'Invalid fixture filename'})
        if path in ('/qa-api/functions/v1/quote-product', '/qa-api/functions/v1/quote-image'):
            value = json.loads(self.body()).get('url', '')
            if path.endswith('/quote-product'):
                if value.endswith('/new-item'):
                    return self.send(200, dict(title='Mặt hàng mới QA', image='https://example.invalid/qa-product.png'))
                return self.send(200, dict(title='QA 01 · Ảnh dự phòng', image='https://fixture.invalid/unavailable.png', alternative_image='https://fixture.invalid/alternative.png'))
            FIXTURE['quote_images'].append(value)
            if value.endswith('/unavailable.png'):
                return self.send(404, {'error': 'Ảnh chính QA không tồn tại'})
            filename = 'tile-1.png' if value.endswith('/alternative.png') else 'marker.png'
            data = base64.b64encode((ROOT / 'qa' / filename).read_bytes()).decode()
            return self.send(200, {'ok': True, 'data_url': 'data:image/png;base64,' + data})
        if path.startswith('/qa-api/rest/v1/rpc/'):
            name = path.rsplit('/', 1)[-1]
            payload = json.loads(self.body())
            if name == 'companion_submit_audio':
                if not payload.get('p_claimed_paid') or not payload.get('p_contact_value', '').startswith('qa-'):
                    return self.send(400, {'error': 'QA fixture only accepts dummy requests'})
                FIXTURE['audio_requests'] += 1
                order = dict(id=f"qa-order-{FIXTURE['audio_requests']}", shop_label='SHOP QA', created_at=now(), contact_value=payload['p_contact_value'], contact_platform=payload['p_contact_platform'], status='new', payment_verified=False)
                FIXTURE['orders'].append(order)
                return self.send(200, order['id'])
            if name.startswith('inventory_'):
                return self.inventory_rpc(name.removeprefix('inventory_'), payload)
            return self.send(400, {'error': 'Unsupported QA RPC'})
        return super().do_POST()

    def inventory_rpc(self, action, data):
        imei = action.startswith('imei_')
        action = action.removeprefix('imei_')
        if action == 'create_session':
            sid = f"qa-session-{len(FIXTURE['sessions'])+1}"
            FIXTURE['sessions'][sid] = dict(id=sid, shop_id=data['p_shop'], title=data['p_title'], state='importing', imei=imei)
            FIXTURE['stock'][sid] = []
            FIXTURE['counts'][sid] = {}
            return self.send(200, sid)
        sid = data.get('p_session')
        row = FIXTURE['sessions'].get(sid)
        if not row or row['imei'] != imei:
            return self.send(404, {'error': 'Missing QA session'})
        if action == 'import_batch':
            for item in data['p_items']:
                if imei:
                    FIXTURE['stock'][sid].append(dict(product_code=item.get('product_code', item.get('code')), product_name=item.get('product_name', item.get('name')), imei=item['imei']))
                else:
                    FIXTURE['stock'][sid].append(dict(product_code=item['code'], product_name=item['name'], expected_qty=item['qty']))
        if action in ('finish_import', 'reopen_session', 'close_session'):
            row['state'] = 'closed' if action == 'close_session' else 'open'
        if action == 'scan':
            if row['state'] != 'open':
                return self.send(409, {'error': 'QA session is closed'})
            counts = FIXTURE['counts'][sid]
            if imei:
                serial = data['p_imei']
                expected = next((x for x in FIXTURE['stock'][sid] if x['imei'] == serial), {})
                if serial in counts:
                    return self.send(200, {**counts[serial], 'status': 'duplicate'})
                counts[serial] = dict(imei=serial, product_code=expected.get('product_code') or data.get('p_code') or 'QA-EXTRA', product_name=expected.get('product_name') or data.get('p_name') or 'Ngoài tồn QA', scanned_at=now())
                return self.send(200, {**counts[serial], 'status': 'saved'})
            code = data['p_code']
            counts[code] = dict(product_code=code, product_name=data.get('p_name') or 'Sản phẩm QA', counted_qty=(counts.get(code, {}).get('counted_qty', 0) + 1), updated_at=now())
            return self.send(200, counts[code])
        return self.send(200, {'ok': True})

    def do_PATCH(self):
        path = urlsplit(self.path)
        nid = parse_qs(path.query).get('id', [''])[0].removeprefix('eq.')
        note = next((n for n in FIXTURE['notifications'] if n['id'] == nid), None)
        if path.path == '/qa-api/rest/v1/notifications' and note:
            note['read_at'] = json.loads(self.body()).get('read_at')
            return self.send(200, [note])
        return super().do_PATCH()


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('--host', default='127.0.0.1')
    cli.add_argument('--port', type=int, default=4173)
    cli.add_argument('--strictPort', action='store_true')
    opts = cli.parse_args()
    ThreadingHTTPServer((opts.host, opts.port), Acceptance).serve_forever()
