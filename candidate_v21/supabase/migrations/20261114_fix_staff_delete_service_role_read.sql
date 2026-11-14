-- 112191 WORK v2.2.1: Fix Delete Forever preflight (read-only access).
-- The original public business tables granted SELECT to authenticated, but
-- did NOT grant SELECT to service_role. The private manage-staff Edge Function
-- uses service_role to look for linked tasks/assignments before deletion.
-- Grant only SELECT to trusted server role; never change anon/authenticated grants.
BEGIN;
GRANT SELECT ON TABLE
 public.assignments,
 public.notifications,
 public.tasks,
 public.recurring_members,
 public.recurring_templates
 TO service_role;
COMMIT;