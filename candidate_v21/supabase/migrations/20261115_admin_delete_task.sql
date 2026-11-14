-- 112191 WORK v2.5. Admin-only permanent deletion of a single task.
-- A deleted task removes its assignments and linked notifications via existing
-- FK cascades. Recurring templates are NOT deleted; future runs stay intact.
-- Photo paths are recorded in an audit so private Storage cleanup can retry.
BEGIN;
CREATE TABLE IF NOT EXISTS public.work_deleted_task_audit(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  task_title text NOT NULL,
  removed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  removed_at timestamptz NOT NULL DEFAULT now(),
  assignment_count integer NOT NULL DEFAULT 0,
  notification_count integer NOT NULL DEFAULT 0,
  photos text[] NOT NULL DEFAULT '{}',
  storage_cleanup_complete boolean NOT NULL DEFAULT false,
  storage_cleanup_at timestamptz
);
ALTER TABLE public.work_deleted_task_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.work_deleted_task_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.work_deleted_task_audit TO service_role;

CREATE OR REPLACE FUNCTION app_private.work_task_photo_paths(p_task uuid)
RETURNS text[] LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $$
 SELECT coalesce(array_agg(DISTINCT x.name ORDER BY x.name),'{}'::text[])
 FROM (
  SELECT unnest(a.photo_paths) AS name
  FROM public.assignments a WHERE a.task_id=p_task
  UNION
  SELECT o.name
  FROM storage.objects o
  JOIN public.assignments a ON a.task_id=p_task
    AND o.name LIKE a.staff_id::text||'/'||a.id::text||'/%'
  WHERE o.bucket_id='task-evidence'
 ) x WHERE x.name<>'' AND x.name IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION app_private.work_task_photo_paths(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.work_admin_task_preview(p_task uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE t public.tasks%ROWTYPE; v_photos text[];
BEGIN
 IF NOT EXISTS(
  SELECT 1 FROM public.profiles
  WHERE id=p_actor AND employee_code='112191' AND is_admin=true
    AND role='manager' AND active=true AND must_change_password=false
 ) THEN RAISE EXCEPTION 'Only Admin 112191 may delete a task'; END IF;
 SELECT * INTO t FROM public.tasks WHERE id=p_task;
 IF NOT FOUND THEN RAISE EXCEPTION 'Task no longer exists'; END IF;
 v_photos:=app_private.work_task_photo_paths(p_task);
 RETURN jsonb_build_object(
  'task_id',t.id,'title',t.title,
  'assignments',(SELECT count(*) FROM public.assignments WHERE task_id=p_task),
  'notifications',(SELECT count(*) FROM public.notifications WHERE task_id=p_task),
  'photos',cardinality(v_photos),
  'is_recurring_occurrence',t.recurring_template_id IS NOT NULL
 );
END;
$$;

CREATE OR REPLACE FUNCTION public.work_admin_delete_task(
 p_task uuid,p_actor uuid,p_expected_assignments integer,p_expected_photos integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE t public.tasks%ROWTYPE; v_photos text[]; v_assignments integer;
 v_notifications integer; v_audit uuid;
BEGIN
 IF NOT EXISTS(
  SELECT 1 FROM public.profiles
  WHERE id=p_actor AND employee_code='112191' AND is_admin=true
    AND role='manager' AND active=true AND must_change_password=false
 ) THEN RAISE EXCEPTION 'Only Admin 112191 may delete a task'; END IF;
 SELECT * INTO t FROM public.tasks WHERE id=p_task FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Task no longer exists'; END IF;
 SELECT count(*) INTO v_assignments FROM public.assignments WHERE task_id=p_task;
 SELECT count(*) INTO v_notifications FROM public.notifications WHERE task_id=p_task;
 v_photos:=app_private.work_task_photo_paths(p_task);
 IF v_assignments IS DISTINCT FROM p_expected_assignments
    OR cardinality(v_photos) IS DISTINCT FROM p_expected_photos THEN
  RAISE EXCEPTION 'Task has changed; refresh deletion confirmation';
 END IF;

 INSERT INTO public.work_deleted_task_audit(
  task_id,task_title,removed_by,assignment_count,notification_count,
  photos,storage_cleanup_complete)
 VALUES(t.id,t.title,p_actor,v_assignments,v_notifications,v_photos,cardinality(v_photos)=0)
 RETURNING id INTO v_audit;

 -- Existing foreign keys CASCADE: task -> assignments -> push delivery +
 -- notification, task -> notification; do not delete any recurring template.
 DELETE FROM public.tasks WHERE id=p_task;
 IF NOT FOUND THEN RAISE EXCEPTION 'Task deletion failed'; END IF;
 RETURN jsonb_build_object('ok',true,'audit_id',v_audit,
   'task_id',p_task,'title',t.title,'assignments_removed',v_assignments,
   'notifications_removed',v_notifications,'photo_paths',to_jsonb(v_photos));
END;
$$;
REVOKE ALL ON FUNCTION public.work_admin_task_preview(uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.work_admin_delete_task(uuid,uuid,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.work_admin_task_preview(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.work_admin_delete_task(uuid,uuid,integer,integer) TO service_role;
COMMIT;