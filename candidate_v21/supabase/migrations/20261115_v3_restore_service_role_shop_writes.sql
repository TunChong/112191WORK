-- 112191 WORK v3.0.4 — privilege and hardening changes
-- Applied to Supabase project oyjrgbpjrazwvmiomquw on 2026-11-15.
-- Grant writes only to server-side service_role. Browser roles remain read-only on SHOP membership.
BEGIN;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.work_shops TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.work_shop_memberships TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_work_user() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.notify_work_assignment() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.is_work_manager() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.is_work_staff_ready() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.is_work_supervisor() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_work_manager() TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.is_work_staff_ready() TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.is_work_supervisor() TO authenticated,service_role;
COMMIT;
-- AFTER all tenant-specific RLS policies, RPCs and Edge Functions have been tested:
-- UPDATE public.work_multi_shop_config SET isolation_ready=true,updated_at=now() WHERE key='production';
-- 2026-11-15: flag set to true following transaction-scoped role tests for manager, shift_lead and staff.
