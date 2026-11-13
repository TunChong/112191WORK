import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const read=(p)=>readFileSync(new URL(p, import.meta.url),'utf8');
const app=read('./app.js');
const api=read('./supabase/functions/manage-staff/index.ts');
const sql=read('./supabase/migrations/20261113_manage_staff.sql');
const html=read('./index.html');

// User-facing feature regression assertions.
assert.match(app, /<option>Công Việc Siêu Thị<\/option>/);
assert.match(app, /function createView\(\)/);
assert.match(app, /function accountsView\(\)\{\s*if\(!manager\(\)\)/);
assert.match(app, /\['accounts','Quản lý tài khoản','shield'\]/);
assert.match(app, /staffAdminRequest\(\{action:'create'/);
assert.match(app, /'createStaffForm'/);
assert.match(app, /data-action="reset-staff-password"/);
assert.match(app, /data-action="toggle-staff-account"/);
assert.match(app, /password_changed_at/);

// Require server-side roles and a request token, never browser service role.
assert.match(api, /managerProfiles\[0\]\?\.role!=='manager'/);
assert.match(api, /signed=await request\('\/auth\/v1\/user'/);
assert.match(api, /action==='create'/);
assert.match(api, /action==='reset_password'/);
assert.match(api, /ban_duration/);
assert.match(api, /staff_account_audit/);
assert.match(sql, /enable row level security/);
assert.match(sql, /app_private\.track_staff_password_change/);
assert.match(sql, /app_private\.guard_profile_permissions/);
assert.doesNotMatch(app,/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/);
assert.doesNotMatch(read('./config.js'),/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/);
assert.match(html,/styles\.css\?v=2\.1/);
assert.match(html,/app\.js\?v=2\.1/);

console.log('PASS: task category, manager account UI, server-side auth, archive and secret checks');
