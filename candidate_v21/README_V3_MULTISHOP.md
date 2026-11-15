# 112191 WORK v3.0 — Multi-SHOP (target: ~500 shops)

**State (2026-11-15): Foundation live; multi-shop isolation / rollout NOT complete.**

## Decisions
- Login account 112191 is the only system Super Admin. Can create / disable shops, assign shop managers, and review all shops.
- A shop manager can add, archive, reset the password of, and assign shifts to staff **of their authorized shop only**.
- A person may be linked to multiple shops, with a different membership role in each.
- Never duplicate Supabase Auth users for the same employee code. For an existing employee in another shop, require Super Admin authorization to link them.
- An authorized shop manager must never be able to create a shop, grant manager access to another user, or alter their own permissions.
- A shift lead can assign/review within authorized shop, but cannot create users.
- Staff can only view their own assigned tasks, media and reports for active memberships.
- A manager revocation should take effect at the database and privileged API level, independently of already-issued JWT claims.
- An existing shop's data must not disappear or get reassigned during migration.

## Live phase 1 (completed)
- Created `work_shops` and `work_shop_memberships` with UUID keys, unique shop codes, composite PK and indexes for shop/user access.
- Server-checkable helpers `work_is_super_admin`, `work_can_access_shop`, `work_can_manage_shop` and `work_can_supervise_shop`.
- Both new tables have RLS; direct browser writes are not granted.
- Initialized SHOP 102 (ĐMX 102 Lê Văn Khương) and granted 112191 its manager membership.
- Existing profiles/tasks/assignments/notifications/storage remain as-is.

## Release gates (NOT YET PASSED)
1. Add required immutable shop ID to tasks, recurring templates, and task notifications; backfill legacy records to SHOP 102.
2. Replace **all** old global-manager RLS access on profiles, tasks, assignments, recurring, storage objects; prevent cross-shop joins and reassignment.
3. Patch SECURITY DEFINER RPC functions for submit, review, scheduling, overdue notifications and any backend that reads across shops.
4. Restrict existing manage-staff Edge Function (currently treats any manager as global). Replace with shop-scoped actions; Super Admin remains global.
5. Add shop selector and management UI; ensure active shop is sent explicitly on every write, and pages fetch only that shop's paginated data.
6. Test with at least 2 shops, 2 managers, 1 shared employee, a shift lead, revoked access and malicious direct REST calls. Include media and notification checks.
7. Validate public deployment as a preview. Only then cut over the Cloudflare Production site; manual Cloudflare deployment is still required.
8. Assess sizing/pricing for ~500 shops, staff accounts, media storage, notifications and concurrent sessions.

## Do not do
- Do not grant `authenticated` direct INSERT/UPDATE/DELETE on memberships or shops.
- Do not rely on `profiles.role` or JS visibility alone for shop-level authorization.
- Do not expose service-role keys in frontend code.
- Do not deploy a second shop while legacy global manager policies still govern business data.

See the SQL migration file in `candidate_v21/supabase/migrations/20261115_v3_phase1_multishop.sql`.
