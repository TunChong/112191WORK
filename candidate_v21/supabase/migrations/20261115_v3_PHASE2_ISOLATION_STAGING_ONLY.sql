
-- 112191 WORK v3.0 SHOP DATA ISOLATION (STAGING ONLY)
-- DO NOT APPLY ON PRODUCTION UNTIL LEGACY manage-staff IS SCOPED, CLIENT IS UPDATED,
-- AND E2E INTEGRATION TESTS COVER TWO MANAGERS AND MULTIPLE SHOPS.
-- Prerequisites: 20261115_v3_phase1_multishop.sql + safety gate + shop_id columns.

CREATE OR REPLACE FUNCTION public.work_is_shop_staff(p_shop uuid,p_staff uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT (public.work_can_supervise_shop(p_shop) OR p_staff=(select auth.uid()))
AND EXISTS (
 SELECT 1 FROM public.work_shop_memberships m
 JOIN public.profiles p ON p.id=m.user_id
 JOIN public.work_shops s ON s.id=m.shop_id
 WHERE m.user_id=p_staff AND m.shop_id=p_shop AND m.shop_role='staff'
 AND m.active AND p.active AND NOT p.must_change_password AND s.active) $$;
CREATE OR REPLACE FUNCTION public.work_is_task_assignee(p_task uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS(SELECT 1 FROM public.assignments a
 WHERE a.task_id=p_task AND a.staff_id=(select auth.uid())) $$;
REVOKE ALL ON FUNCTION public.work_is_shop_staff(uuid,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.work_is_task_assignee(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.work_is_shop_staff(uuid,uuid) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.work_is_task_assignee(uuid) TO authenticated,service_role;

-- Do not allow a manager of one SHOP to see global employee directory.
DROP POLICY IF EXISTS profiles_view ON public.profiles;
CREATE POLICY profiles_view ON public.profiles FOR SELECT TO authenticated
USING (id=(select auth.uid()) OR public.work_is_super_admin()
 OR EXISTS (SELECT 1 FROM public.work_shop_memberships m
  WHERE m.user_id=profiles.id AND m.active AND public.work_can_supervise_shop(m.shop_id)));
DROP POLICY IF EXISTS profiles_manager_edit ON public.profiles;
CREATE POLICY profiles_manager_edit ON public.profiles FOR UPDATE TO authenticated
USING (public.work_is_super_admin()) WITH CHECK (public.work_is_super_admin());

DROP POLICY IF EXISTS tasks_view ON public.tasks;
CREATE POLICY tasks_view ON public.tasks FOR SELECT TO authenticated
USING (public.work_can_supervise_shop(shop_id)
 OR (public.work_can_access_shop(shop_id) AND public.work_is_task_assignee(id)));
DROP POLICY IF EXISTS tasks_manager_insert ON public.tasks;
CREATE POLICY tasks_manager_insert ON public.tasks FOR INSERT TO authenticated
WITH CHECK (created_by=(select auth.uid()) AND public.work_can_supervise_shop(shop_id));
DROP POLICY IF EXISTS tasks_manager_update ON public.tasks;
CREATE POLICY tasks_manager_update ON public.tasks FOR UPDATE TO authenticated
USING (public.work_can_manage_shop(shop_id))
WITH CHECK (public.work_can_manage_shop(shop_id));
DROP POLICY IF EXISTS tasks_manager_delete ON public.tasks;
CREATE POLICY tasks_manager_delete ON public.tasks FOR DELETE TO authenticated
USING (public.work_is_super_admin());

DROP POLICY IF EXISTS assignments_view ON public.assignments;
CREATE POLICY assignments_view ON public.assignments FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.tasks t
 WHERE t.id=assignments.task_id
 AND (public.work_can_supervise_shop(t.shop_id)
 OR (staff_id=(select auth.uid()) AND public.work_can_access_shop(t.shop_id)))));
DROP POLICY IF EXISTS assignments_manager_insert ON public.assignments;
CREATE POLICY assignments_manager_insert ON public.assignments FOR INSERT TO authenticated
WITH CHECK (EXISTS(SELECT 1 FROM public.tasks t
 WHERE t.id=assignments.task_id
 AND public.work_can_supervise_shop(t.shop_id)
 AND public.work_is_shop_staff(t.shop_id,assignments.staff_id)));
DROP POLICY IF EXISTS assignments_manager_delete ON public.assignments;
CREATE POLICY assignments_manager_delete ON public.assignments FOR DELETE TO authenticated
USING (public.work_is_super_admin());

DROP POLICY IF EXISTS recurrence_view ON public.recurring_templates;
CREATE POLICY recurrence_view ON public.recurring_templates FOR SELECT TO authenticated
USING (public.work_can_manage_shop(shop_id));
DROP POLICY IF EXISTS recurrence_insert ON public.recurring_templates;
CREATE POLICY recurrence_insert ON public.recurring_templates FOR INSERT TO authenticated
WITH CHECK (created_by=(select auth.uid()) AND public.work_can_manage_shop(shop_id));
DROP POLICY IF EXISTS recurrence_update ON public.recurring_templates;
CREATE POLICY recurrence_update ON public.recurring_templates FOR UPDATE TO authenticated
USING (public.work_can_manage_shop(shop_id)) WITH CHECK(public.work_can_manage_shop(shop_id));
DROP POLICY IF EXISTS recurrence_delete ON public.recurring_templates;
CREATE POLICY recurrence_delete ON public.recurring_templates FOR DELETE TO authenticated
USING (public.work_can_manage_shop(shop_id));

DROP POLICY IF EXISTS recurrence_members_view ON public.recurring_members;
CREATE POLICY recurrence_members_view ON public.recurring_members FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.recurring_templates r
 WHERE r.id=recurring_members.template_id AND public.work_can_manage_shop(r.shop_id)));
DROP POLICY IF EXISTS recurrence_members_insert ON public.recurring_members;
CREATE POLICY recurrence_members_insert ON public.recurring_members FOR INSERT TO authenticated
WITH CHECK (EXISTS(SELECT 1 FROM public.recurring_templates r
 WHERE r.id=recurring_members.template_id AND public.work_can_manage_shop(r.shop_id)
 AND public.work_is_shop_staff(r.shop_id,recurring_members.staff_id)));
DROP POLICY IF EXISTS recurrence_members_delete ON public.recurring_members;
CREATE POLICY recurrence_members_delete ON public.recurring_members FOR DELETE TO authenticated
USING (EXISTS(SELECT 1 FROM public.recurring_templates r
 WHERE r.id=recurring_members.template_id AND public.work_can_manage_shop(r.shop_id)));

DROP POLICY IF EXISTS notifications_view ON public.notifications;
CREATE POLICY notifications_view ON public.notifications FOR SELECT TO authenticated
USING (recipient_id=(select auth.uid())
 AND (shop_id IS NULL OR public.work_can_access_shop(shop_id)));
DROP POLICY IF EXISTS notifications_read ON public.notifications;
CREATE POLICY notifications_read ON public.notifications FOR UPDATE TO authenticated
USING (recipient_id=(select auth.uid())
 AND (shop_id IS NULL OR public.work_can_access_shop(shop_id)))
WITH CHECK(recipient_id=(select auth.uid())
 AND (shop_id IS NULL OR public.work_can_access_shop(shop_id)));
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE(read_at) ON public.notifications TO authenticated;

-- A staff member may upload photos only for assigned work belonging to an active shop.
DROP POLICY IF EXISTS work_evidence_read ON storage.objects;
CREATE POLICY work_evidence_read ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='task-evidence' AND EXISTS(
 SELECT 1 FROM public.assignments a JOIN public.tasks t ON t.id=a.task_id
 WHERE a.id::text=(storage.foldername(name))[2]
 AND ( (a.staff_id=(select auth.uid()) AND owner_id=(select auth.uid())::text
          AND public.work_can_access_shop(t.shop_id))
 OR public.work_can_supervise_shop(t.shop_id))));
DROP POLICY IF EXISTS work_evidence_upload ON storage.objects;
CREATE POLICY work_evidence_upload ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='task-evidence'
 AND (storage.foldername(name))[1]=(select auth.uid())::text
 AND EXISTS(SELECT 1 FROM public.assignments a JOIN public.tasks t ON t.id=a.task_id
 WHERE a.id::text=(storage.foldername(name))[2]
 AND a.staff_id=(select auth.uid()) AND a.status IN ('todo','rejected')
 AND public.work_is_shop_staff(t.shop_id,(select auth.uid()))));


-- Shift leads need membership visibility to choose staff for task assignment,
-- but cannot change membership records.
DROP POLICY IF EXISTS work_shop_memberships_view ON public.work_shop_memberships;
CREATE POLICY work_shop_memberships_view ON public.work_shop_memberships FOR SELECT TO authenticated
USING (user_id=(select auth.uid()) OR public.work_can_supervise_shop(shop_id));

-- Business RPCs run as DEFINER, so they must explicitly verify shop membership.
CREATE OR REPLACE FUNCTION public.review_assignment(
 p_assignment_id uuid,p_approved boolean,p_feedback text DEFAULT ''
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE a public.assignments; t public.tasks;
BEGIN
 SELECT * INTO a FROM public.assignments WHERE id=p_assignment_id FOR UPDATE;
 IF NOT FOUND OR a.status<>'submitted' THEN RAISE EXCEPTION 'Báo cáo chưa ở trạng thái chờ duyệt'; END IF;
 SELECT * INTO t FROM public.tasks WHERE id=a.task_id;
 IF NOT FOUND OR NOT public.work_can_supervise_shop(t.shop_id)
 THEN RAISE EXCEPTION 'Không có quyền duyệt tại SHOP này'; END IF;
 IF NOT coalesce(p_approved,false) AND length(trim(coalesce(p_feedback,'')))<5
 THEN RAISE EXCEPTION 'Cần nhập lý do yêu cầu làm lại'; END IF;
 UPDATE public.assignments SET
 status=CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
 reviewed_at=now(),review_feedback=nullif(left(coalesce(p_feedback,''),800),'')
 WHERE id=p_assignment_id;
 INSERT INTO public.notifications(recipient_id,title,body,task_id,assignment_id,shop_id)
 VALUES(a.staff_id,CASE WHEN p_approved THEN 'Đã duyệt hoàn thành' ELSE 'Yêu cầu thực hiện lại' END,
 t.title||CASE WHEN p_approved THEN '' ELSE ' · '||left(coalesce(p_feedback,''),300) END,
 t.id,p_assignment_id,t.shop_id);
END $$;

CREATE OR REPLACE FUNCTION public.submit_assignment(
 p_assignment_id uuid,p_notes text,p_photo_paths text[]
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE a public.assignments; t public.tasks; n int;
BEGIN
 SELECT * INTO a FROM public.assignments WHERE id=p_assignment_id FOR UPDATE;
 IF NOT FOUND OR a.staff_id IS DISTINCT FROM (select auth.uid())
 THEN RAISE EXCEPTION 'Không có quyền nộp báo cáo'; END IF;
 SELECT * INTO t FROM public.tasks WHERE id=a.task_id;
 IF NOT FOUND OR NOT public.work_is_shop_staff(t.shop_id,(select auth.uid()))
 THEN RAISE EXCEPTION 'Tài khoản không thuộc SHOP của công việc';END IF;
 IF a.status NOT IN ('todo','rejected') THEN RAISE EXCEPTION 'Trạng thái không cho phép nộp';END IF;
 IF cardinality(coalesce(p_photo_paths,'{}'::text[])) NOT BETWEEN 1 AND 3
 THEN RAISE EXCEPTION 'Cần từ 1 đến 3 ảnh';END IF;
 SELECT count(*) INTO n FROM storage.objects o
 WHERE o.bucket_id='task-evidence' AND o.name=ANY(p_photo_paths)
 AND o.owner_id=(select auth.uid())::text
 AND (storage.foldername(o.name))[1]=(select auth.uid())::text
 AND (storage.foldername(o.name))[2]=p_assignment_id::text;
 IF n<>cardinality(p_photo_paths) THEN RAISE EXCEPTION 'Ảnh không hợp lệ';END IF;
 UPDATE public.assignments SET status='submitted',
 report_notes=left(coalesce(p_notes,''),1000),
 photo_paths=p_photo_paths,submitted_at=now(),reviewed_at=null,review_feedback=null
 WHERE id=p_assignment_id;
 INSERT INTO public.notifications(recipient_id,title,body,task_id,assignment_id,shop_id)
 SELECT m.user_id,'Có báo cáo chờ duyệt',t.title,t.id,p_assignment_id,t.shop_id
 FROM public.work_shop_memberships m JOIN public.profiles p ON p.id=m.user_id
 WHERE m.shop_id=t.shop_id AND m.shop_role IN ('manager','shift_lead')
 AND m.active AND p.active AND NOT p.must_change_password;
END $$;

-- Remove the ability of an arbitrary manager to trigger recurrence for every shop.
CREATE OR REPLACE FUNCTION public.generate_daily_tasks()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF NOT public.work_is_super_admin() THEN
 RAISE EXCEPTION 'Chỉ Super Admin được kích hoạt chạy công việc định kỳ toàn hệ thống';
 END IF;
 RETURN public.generate_daily_tasks_internal();
END $$;
REVOKE ALL ON FUNCTION public.generate_daily_tasks_internal() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.generate_daily_tasks_internal() TO service_role;

-- Scheduled recurring work must keep the same shop_id, not default to SHOP 102.
CREATE OR REPLACE FUNCTION public.generate_daily_tasks_internal()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE r public.recurring_templates; v_task uuid; v_on date;
 v_count int:=0; v_time timestamptz;
BEGIN
 v_on=(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
 FOR r IN SELECT rt.* FROM public.recurring_templates rt
 JOIN public.work_shops s ON s.id=rt.shop_id AND s.active
 WHERE rt.active AND rt.start_on<=v_on LOOP
   v_time=(v_on + r.due_time) AT TIME ZONE 'Asia/Ho_Chi_Minh';
   INSERT INTO public.tasks(shop_id,title,description,category,priority,due_at,created_by,recurring_template_id,recurring_on)
   VALUES(r.shop_id,r.title,r.description,r.category,r.priority,v_time,r.created_by,r.id,v_on)
   ON CONFLICT(recurring_template_id,recurring_on) DO NOTHING RETURNING id INTO v_task;
   IF v_task IS NOT NULL THEN v_count:=v_count+1;
   ELSE SELECT t.id INTO v_task FROM public.tasks t
    WHERE t.recurring_template_id=r.id AND t.recurring_on=v_on;END IF;
   INSERT INTO public.assignments(task_id,staff_id)
   SELECT v_task,m.user_id FROM public.recurring_members rm
   JOIN public.work_shop_memberships m ON m.user_id=rm.staff_id AND m.shop_id=r.shop_id
    AND m.active AND m.shop_role='staff'
   JOIN public.profiles p ON p.id=rm.staff_id AND p.active AND NOT p.must_change_password
   WHERE rm.template_id=r.id
   ON CONFLICT(task_id,staff_id) DO NOTHING;
   v_task:=NULL;
 END LOOP;
 RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION public.process_work_deadlines()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE x record; v_count int:=0; v_type text; v_title text; v_key text;
BEGIN
 FOR x IN
 SELECT a.id AS aid,a.staff_id,t.id AS tid,t.title,t.due_at,t.shop_id
 FROM public.assignments a JOIN public.tasks t ON t.id=a.task_id
 JOIN public.work_shops s ON s.id=t.shop_id AND s.active
 WHERE a.status IN ('todo','rejected')
 AND t.due_at BETWEEN now()-interval '30 days' AND now()+interval '30 minutes'
 LOOP
  IF x.due_at<=now() THEN v_type:='late';v_title:='Công việc quá hạn';
  ELSE v_type:='soon';v_title:='Sắp đến hạn';END IF;
  v_key:=v_type||':'||x.aid::text;
  INSERT INTO public.notifications(recipient_id,title,body,task_id,assignment_id,event_key,shop_id)
  VALUES(x.staff_id,v_title,x.title,x.tid,x.aid,v_key,x.shop_id)
  ON CONFLICT(recipient_id,event_key) DO NOTHING;
  IF v_type='late' THEN
   INSERT INTO public.notifications(recipient_id,title,body,task_id,assignment_id,event_key,shop_id)
   SELECT m.user_id,'Nhân viên trễ hạn',x.title,x.tid,x.aid,v_key,x.shop_id
   FROM public.work_shop_memberships m JOIN public.profiles p ON p.id=m.user_id
   WHERE m.shop_id=x.shop_id AND m.shop_role IN ('manager','shift_lead')
   AND m.active AND p.active AND NOT p.must_change_password
   ON CONFLICT(recipient_id,event_key) DO NOTHING;
  END IF;
  v_count:=v_count+1;
 END LOOP;
 RETURN v_count;
END $$;
