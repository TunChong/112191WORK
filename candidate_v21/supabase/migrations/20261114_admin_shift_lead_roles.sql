-- 112191 WORK: introduce owner-admin flag and Shift Lead without breaking legacy manager login.
-- Existing production 112191 remains role=manager for backward compatibility.
BEGIN;

DO $$
BEGIN
 IF (select count(*) from public.profiles where employee_code='112191' and role='manager' and active=true) <> 1 THEN
   RAISE EXCEPTION 'Cannot locate exactly one active 112191 manager; abort migration';
 END IF;
 IF (select count(*) from public.profiles where employee_code='16784' and role='manager') <> 1 THEN
   RAISE EXCEPTION 'Cannot locate the archived-manager target 16784; abort migration';
 END IF;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
 CHECK (role IN ('staff','shift_lead','manager'));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_admin_identity_check
 CHECK (NOT is_admin OR (employee_code='112191' AND role='manager'));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_only_one_admin ON public.profiles(is_admin) WHERE is_admin;

UPDATE public.profiles SET is_admin=true
 WHERE employee_code='112191' AND role='manager' AND active=true;
-- Archive and demote the second legacy manager; never remove historical tasks/assignments.
UPDATE public.profiles SET role='staff',active=false,is_admin=false
 WHERE employee_code='16784' AND role='manager';
INSERT INTO public.staff_account_audit(actor_id,target_user_id,employee_code,action)
 SELECT a.id,h.id,h.employee_code,'deactivated'
 FROM public.profiles a JOIN public.profiles h ON h.employee_code='16784'
 WHERE a.employee_code='112191' AND a.is_admin=true;

-- Privilege fields and identity cannot be modified directly by a browser account.
CREATE OR REPLACE FUNCTION app_private.guard_profile_permissions()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN
 IF current_user='authenticated' AND (
   NEW.role IS DISTINCT FROM OLD.role OR
   NEW.active IS DISTINCT FROM OLD.active OR
   NEW.must_change_password IS DISTINCT FROM OLD.must_change_password OR
   NEW.is_admin IS DISTINCT FROM OLD.is_admin OR
   NEW.employee_code IS DISTINCT FROM OLD.employee_code
 ) THEN
    RAISE EXCEPTION 'Only server administration may change account privileges';
 END IF;
 RETURN NEW;
END $$;

-- Supervision powers are separate from account administration.
CREATE OR REPLACE FUNCTION public.is_work_supervisor()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
 SELECT EXISTS(
   SELECT 1 FROM public.profiles
   WHERE id=auth.uid() AND role IN ('manager','shift_lead')
     AND active=true AND must_change_password=false
 );
$$;
REVOKE ALL ON FUNCTION public.is_work_supervisor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_work_supervisor() TO authenticated, service_role;

-- Shift Leads may read only active workers and their own profile. Manager can view all.
DROP POLICY IF EXISTS profiles_view ON public.profiles;
CREATE POLICY profiles_view ON public.profiles FOR SELECT TO authenticated
 USING (
  id=auth.uid() OR public.is_work_manager()
  OR (public.is_work_supervisor() AND role='staff' AND active=true)
 );

DROP POLICY IF EXISTS tasks_view ON public.tasks;
CREATE POLICY tasks_view ON public.tasks FOR SELECT TO authenticated
 USING (
  public.is_work_supervisor()
  OR EXISTS(
    SELECT 1 FROM public.assignments a JOIN public.profiles p ON p.id=a.staff_id AND p.active=true
    WHERE a.task_id=tasks.id AND a.staff_id=auth.uid() AND public.is_work_staff_ready()
  )
 );
DROP POLICY IF EXISTS tasks_manager_insert ON public.tasks;
CREATE POLICY tasks_manager_insert ON public.tasks FOR INSERT TO authenticated
 WITH CHECK (public.is_work_supervisor() AND created_by=auth.uid());

DROP POLICY IF EXISTS assignments_view ON public.assignments;
CREATE POLICY assignments_view ON public.assignments FOR SELECT TO authenticated
 USING (public.is_work_supervisor() OR (staff_id=auth.uid() AND public.is_work_staff_ready()));
DROP POLICY IF EXISTS assignments_manager_insert ON public.assignments;
CREATE POLICY assignments_manager_insert ON public.assignments FOR INSERT TO authenticated
 WITH CHECK (
  public.is_work_supervisor() AND
  EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=assignments.staff_id AND p.role='staff' AND p.active=true)
 );

DROP POLICY IF EXISTS notifications_view ON public.notifications;
CREATE POLICY notifications_view ON public.notifications FOR SELECT TO authenticated
 USING (recipient_id=auth.uid() AND (public.is_work_supervisor() OR public.is_work_staff_ready()));
DROP POLICY IF EXISTS notifications_read ON public.notifications;
CREATE POLICY notifications_read ON public.notifications FOR UPDATE TO authenticated
 USING (recipient_id=auth.uid() AND (public.is_work_supervisor() OR public.is_work_staff_ready()))
 WITH CHECK (recipient_id=auth.uid() AND (public.is_work_supervisor() OR public.is_work_staff_ready()));

-- Existing review routine: same validation/notification, add Shift Lead authorization.
CREATE OR REPLACE FUNCTION public.review_assignment(
 p_assignment_id uuid,p_approved boolean,p_feedback text DEFAULT ''
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_a public.assignments;v_t public.tasks;
BEGIN
 IF NOT public.is_work_supervisor() THEN RAISE EXCEPTION 'Chỉ trưởng ca hoặc quản lý mới được duyệt';END IF;
 SELECT * INTO v_a FROM public.assignments WHERE id=p_assignment_id FOR UPDATE;
 IF NOT FOUND OR v_a.status<>'submitted' THEN RAISE EXCEPTION 'Báo cáo chưa ở trạng thái chờ duyệt';END IF;
 IF NOT coalesce(p_approved,false) AND length(trim(coalesce(p_feedback,'')))<5 THEN RAISE EXCEPTION 'Cần nhập lý do yêu cầu làm lại';END IF;
 UPDATE public.assignments SET
  status=(CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END),
  reviewed_at=now(),review_feedback=nullif(left(coalesce(p_feedback,''),800),'')
 WHERE id=p_assignment_id;
 SELECT * INTO v_t FROM public.tasks WHERE id=v_a.task_id;
 INSERT INTO public.notifications(recipient_id,title,body,task_id,assignment_id)
 VALUES(v_a.staff_id,
 CASE WHEN p_approved THEN 'Đã duyệt hoàn thành' ELSE 'Yêu cầu thực hiện lại' END,
 v_t.title||CASE WHEN p_approved THEN '' ELSE ' · '||left(coalesce(p_feedback,''),300) END,
 v_t.id,p_assignment_id);
END;
$$;

-- A new employee report also notifies Shift Leads and Managers with active accounts.
CREATE OR REPLACE FUNCTION public.submit_assignment(
 p_assignment_id uuid,p_notes text,p_photo_paths text[]
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_a public.assignments;v_t public.tasks;v_count integer;
BEGIN
 SELECT * INTO v_a FROM public.assignments WHERE id=p_assignment_id FOR UPDATE;
 IF NOT FOUND OR v_a.staff_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Không có quyền nộp báo cáo';END IF;
 IF NOT public.is_work_staff_ready() THEN RAISE EXCEPTION 'Tài khoản cần kích hoạt hoặc đổi mật khẩu';END IF;
 IF v_a.status NOT IN ('todo','rejected') THEN RAISE EXCEPTION 'Trạng thái hiện tại không cho phép nộp';END IF;
 IF cardinality(coalesce(p_photo_paths,'{}'::text[])) NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Cần từ 1 đến 3 ảnh minh chứng';END IF;
 SELECT count(*) INTO v_count FROM storage.objects o
 WHERE o.bucket_id='task-evidence' AND o.name=ANY(p_photo_paths)
  AND o.owner_id=auth.uid()::text
  AND (storage.foldername(o.name))[1]=auth.uid()::text
  AND (storage.foldername(o.name))[2]=p_assignment_id::text;
 IF v_count<>cardinality(p_photo_paths) THEN RAISE EXCEPTION 'Ảnh không hợp lệ hoặc chưa tải lên';END IF;
 UPDATE public.assignments SET status='submitted',report_notes=left(coalesce(p_notes,''),1000),
  photo_paths=p_photo_paths,submitted_at=now(),reviewed_at=null,review_feedback=null WHERE id=p_assignment_id;
 SELECT * INTO v_t FROM public.tasks WHERE id=v_a.task_id;
 INSERT INTO public.notifications(recipient_id,title,body,task_id,assignment_id)
 SELECT id,'Có báo cáo chờ duyệt',v_t.title,v_t.id,p_assignment_id
 FROM public.profiles WHERE role IN ('manager','shift_lead') AND active=true AND must_change_password=false;
END;
$$;
COMMIT;