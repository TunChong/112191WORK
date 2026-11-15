-- 112191 WORK v3.0.3 — create daily tasks for exactly one authorized SHOP.
-- Only the sole Super Admin may run global generation; managers may invoke this
-- function for shops where an active manager membership exists.
BEGIN;
CREATE OR REPLACE FUNCTION public.generate_daily_tasks_for_shop(p_shop uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE r public.recurring_templates; v_task uuid; v_on date; v_count int:=0; v_time timestamptz;
BEGIN
 IF p_shop IS NULL OR NOT public.work_can_manage_shop(p_shop) THEN
  RAISE EXCEPTION 'Không có quyền tạo công việc lặp tại SHOP này';
 END IF;
 v_on=(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
 FOR r IN
   SELECT t.* FROM public.recurring_templates t JOIN public.work_shops s ON s.id=t.shop_id
   WHERE t.shop_id=p_shop AND t.active AND s.active AND t.start_on<=v_on
 LOOP
   v_time=(v_on + r.due_time) AT TIME ZONE 'Asia/Ho_Chi_Minh';
   INSERT INTO public.tasks(shop_id,title,description,category,priority,due_at,created_by,recurring_template_id,recurring_on)
   VALUES(r.shop_id,r.title,r.description,r.category,r.priority,v_time,r.created_by,r.id,v_on)
   ON CONFLICT (recurring_template_id,recurring_on) DO NOTHING RETURNING id INTO v_task;
   IF v_task IS NOT NULL THEN v_count:=v_count+1;
   ELSE SELECT t.id INTO v_task FROM public.tasks t WHERE t.recurring_template_id=r.id AND t.recurring_on=v_on; END IF;
   INSERT INTO public.assignments(task_id,staff_id)
   SELECT v_task,rm.staff_id FROM public.recurring_members rm
     JOIN public.work_shop_memberships m ON m.shop_id=r.shop_id AND m.user_id=rm.staff_id
       AND m.active AND m.shop_role='staff'
     JOIN public.profiles p ON p.id=rm.staff_id AND p.active AND NOT p.must_change_password
   WHERE rm.template_id=r.id
   ON CONFLICT(task_id,staff_id) DO NOTHING;
   v_task:=NULL;
 END LOOP;
 RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.generate_daily_tasks_for_shop(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.generate_daily_tasks_for_shop(uuid) TO authenticated,service_role;
COMMIT;