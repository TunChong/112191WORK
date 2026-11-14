-- 112191 WORK — audited permanent removal of archived user even with work records.
-- Only the server's service_role can execute these RPCs. Admin 112191 must
-- explicitly request and confirm from the frontend. Never remove the sole Admin.
-- Storage files are removed by the Storage API, NEVER by deleting storage.objects.
BEGIN;

CREATE OR REPLACE FUNCTION public.staff_delete_preview(
 p_target uuid, p_actor uuid, p_code text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $body$
DECLARE v_target public.profiles%ROWTYPE; v_photo_paths jsonb;
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM public.profiles a
  WHERE a.id=p_actor AND a.is_admin=true AND a.employee_code='112191'
   AND a.role='manager' AND a.active=true AND a.must_change_password=false
 ) THEN RAISE EXCEPTION 'Admin 112191 required'; END IF;

 SELECT * INTO v_target FROM public.profiles WHERE id=p_target;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
 IF v_target.employee_code IS DISTINCT FROM p_code THEN RAISE EXCEPTION 'Code does not match'; END IF;
 IF v_target.is_admin OR v_target.employee_code='112191' OR v_target.id=p_actor
 THEN RAISE EXCEPTION 'Admin account cannot be deleted'; END IF;
 IF v_target.active THEN RAISE EXCEPTION 'Archive the account first'; END IF;

 SELECT coalesce(jsonb_agg(o.name ORDER BY o.name),'[]'::jsonb) INTO v_photo_paths
 FROM storage.objects o WHERE o.bucket_id='task-evidence'
  AND (o.owner_id=p_target::text OR o.name LIKE p_target::text || '/%');

 RETURN jsonb_build_object(
   'employee_code',v_target.employee_code,
   'assignments',(SELECT count(*) FROM public.assignments WHERE staff_id=p_target),
   'notifications',(SELECT count(*) FROM public.notifications WHERE recipient_id=p_target),
   'recurring_members',(SELECT count(*) FROM public.recurring_members WHERE staff_id=p_target),
   'tasks_to_reassign',(SELECT count(*) FROM public.tasks WHERE created_by=p_target),
   'templates_to_reassign',(SELECT count(*) FROM public.recurring_templates WHERE created_by=p_target),
   'photos',jsonb_array_length(v_photo_paths),
   'photo_paths',v_photo_paths
 );
END $body$;

CREATE OR REPLACE FUNCTION public.staff_delete_cleanup(
 p_target uuid, p_actor uuid, p_code text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $body$
DECLARE v_preview jsonb; v_admin uuid; v_n int; v_m int; v_nt int; v_t int; v_rt int;
BEGIN
 -- Locks the account and validates the actor, code and archived status.
 PERFORM 1 FROM public.profiles WHERE id=p_target FOR UPDATE;
 v_preview:=public.staff_delete_preview(p_target,p_actor,p_code);
 IF coalesce((v_preview->>'photos')::int,0)>0 THEN
   RAISE EXCEPTION 'Photo objects must be removed via Storage API first';
 END IF;
 SELECT a.id INTO v_admin FROM public.profiles a
 WHERE a.is_admin=true AND a.employee_code='112191' AND a.active=true;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'Admin 112191 is missing'; END IF;

 -- Keep tasks created for OTHER staff. Reassign author to the Admin.
 UPDATE public.tasks SET created_by=v_admin WHERE created_by=p_target;
 GET DIAGNOSTICS v_t = ROW_COUNT;
 UPDATE public.recurring_templates SET created_by=v_admin WHERE created_by=p_target;
 GET DIAGNOSTICS v_rt = ROW_COUNT;

 -- Deleting an employee's own assignments removes related submission
 -- notifications through existing assignment_id ON DELETE CASCADE.
 DELETE FROM public.assignments WHERE staff_id=p_target;
 GET DIAGNOSTICS v_n = ROW_COUNT;
 DELETE FROM public.recurring_members WHERE staff_id=p_target;
 GET DIAGNOSTICS v_m = ROW_COUNT;
 DELETE FROM public.notifications WHERE recipient_id=p_target;
 GET DIAGNOSTICS v_nt = ROW_COUNT;

 RETURN jsonb_build_object(
   'assignments_removed',v_n,'recurring_members_removed',v_m,
   'recipient_notifications_removed',v_nt,
   'tasks_reassigned',v_t,'templates_reassigned',v_rt
 );
END $body$;

REVOKE ALL ON FUNCTION public.staff_delete_preview(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.staff_delete_cleanup(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_preview(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.staff_delete_cleanup(uuid,uuid,text) TO service_role;
COMMIT;