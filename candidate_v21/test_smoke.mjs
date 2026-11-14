import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const read=(p)=>readFileSync(new URL(p, import.meta.url),'utf8');
const app=read('./app.js');
const api=read('./supabase/functions/manage-staff/index.ts');
const sql=read('./supabase/migrations/20261113_manage_staff.sql');
const rbac=read('./supabase/migrations/20261114_admin_shift_lead_roles.sql');
const deletionGrant=read('./supabase/migrations/20261114_fix_staff_delete_service_role_read.sql');
const hardDelete=read('./supabase/migrations/20261114_safe_hard_delete_with_history.sql');
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
assert.match(app, /normalized\.toLowerCase\(\)\+'quanly@'/);
assert.match(app, /name="password" type="password" autocomplete="new-password"/);
assert.match(app, /'staffResetForm'/);
assert.match(app, /'staffEditForm'/);
assert.match(app, /data-role="shift_lead"/);
assert.match(app, /function supervisor\(\)/);
assert.match(app, /name="role" required/);
assert.match(app, /data-action="edit-staff-role"/);
assert.match(app, /'staffRoleForm'/);
assert.match(app, /\['accounts','Quản lý tài khoản','shield'\]/);

assert.match(app, /data-action="account-filter"/);
assert.match(app, /data-action="delete-staff"/);
assert.match(app, /window.prompt\(summary,/);
assert.match(app, /action:'preview_delete'/);
assert.match(app, /ack_delete_history:true/);
assert.match(app, /expected_counts:counts/);

assert.match(app, /Xóa \(lưu trữ\)/);
assert.match(app, /users\(\)\{return state\.data\?\.profiles\.filter\(x=>x\.role==='staff'&&x\.active\)/);


// Require server-side roles and a request token, never browser service role.
assert.match(api, /managerProfiles\[0\]\?\.role!=='manager'/);
assert.match(api, /managerProfiles\[0\]\?\.must_change_password!==false/);
assert.match(api, /user_metadata:\{employee_code:code,full_name:name\}/);
assert.match(sql, /new\.must_change_password is distinct from old\.must_change_password/);
assert.match(api, /signed=await request\('\/auth\/v1\/user'/);
assert.match(api, /action==='create'/);
assert.match(api, /action==='reset_password'/);
assert.match(api, /action==='update_name'/);
assert.match(api, /viewer_is_admin:actorAdmin/);
assert.match(api, /if\(role==='manager'&&!actorAdmin\)/);
assert.match(api, /action==='set_role'/);
assert.match(api, /p\.is_admin===true/);

assert.match(api, /action==='delete'/);
assert.match(api, /data\.confirm_code!==code/);
assert.match(api, /if\(p\.active\)return reply\(req,409/);
assert.match(api, /storage\/v1\/object\/task-evidence/);
assert.match(sql, /'deleted'/);

assert.match(api, /chooseInitialPassword\(data\.temporary_password,code\)/);
assert.match(api, /password:pw/);
assert.match(sql, /'updated'/);

assert.match(api, /ban_duration/);
assert.match(api, /staff_account_audit/);
assert.match(sql, /enable row level security/);
assert.match(sql, /app_private\.track_staff_password_change/);
assert.match(sql, /app_private\.guard_profile_permissions/);
assert.doesNotMatch(app,/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/);
assert.doesNotMatch(read('./config.js'),/SUPABASE_SERVICE_ROLE_KEY|sb_secret_/);
assert.match(html,/styles\.css\?v=2\.2/);
assert.match(html,/app\.js\?v=2\.2/);

console.log('PASS: task category, manager account UI, server-side auth, archive and secret checks');

assert.match(rbac, /profiles_admin_identity_check/);
assert.match(rbac, /employee_code='112191'/);
assert.match(rbac, /employee_code='16784'/);
assert.match(rbac, /is_work_supervisor/);
assert.match(rbac, /review_assignment/);
assert.match(rbac, /role='staff',active=false/);
assert.match(rbac, /NEW\.is_admin IS DISTINCT FROM OLD\.is_admin/);
assert.match(app, /function admin\(\)/);
assert.match(app, /function supervisor\(\)/);
assert.match(app, /function roleName\(p\)/);
assert.match(app, /name="role" required/);
assert.match(app, /role=String\(fd\.get\('role'\)/);
assert.match(api, /viewer_is_admin:actorAdmin/);
assert.match(api, /if\(role==='manager'&&!actorAdmin\)/);
assert.match(api, /if\(p\.is_admin===true/);
assert.match(api, /action==='set_role'/);
assert.match(api, /is_admin=eq\.false/);

assert.match(deletionGrant, /GRANT SELECT ON TABLE/);
assert.match(deletionGrant, /public\.assignments/);
assert.match(deletionGrant, /public\.recurring_members/);
assert.match(deletionGrant, /TO service_role/);
assert.doesNotMatch(deletionGrant, /TO anon/);
assert.match(api, /Không kiểm tra được lịch sử công việc/);
assert.match(api, /Không kiểm tra được kho ảnh minh chứng/);
assert.match(api, /Tài khoản đã có lịch sử công việc/);

assert.match(hardDelete, /REVOKE ALL ON FUNCTION public.staff_delete_cleanup/);
assert.match(hardDelete, /GRANT EXECUTE ON FUNCTION public.staff_delete_cleanup/);
assert.match(hardDelete, /v_target.is_admin/);
assert.match(hardDelete, /UPDATE public.tasks SET created_by=v_admin/);
assert.match(hardDelete, /DELETE FROM public.assignments WHERE staff_id=p_target/);
assert.doesNotMatch(hardDelete, /DELETE FROM storage.objects/i);
assert.match(api, /action==='preview_delete'/);
assert.match(api, /rpc\/staff_delete_cleanup/);
assert.match(api, /storage\/v1\/object\/task-evidence/);
assert.match(api, /ack_delete_history/);
