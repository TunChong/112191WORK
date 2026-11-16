-- 112191 WORK: one-click permanent SHOP removal, strictly Super Admin only.
-- Deletes only the selected SHOP's inventory/tasks/recurring/report records and
-- memberships. Shared login accounts and records of other shops are preserved.
-- Records photo paths for eventual Storage API deletion, without writing directly
-- to storage.objects (object bytes are held outside Postgres).
BEGIN;
CREATE TABLE IF NOT EXISTS public.work_shop_deleted_media (
 deletion_id uuid NOT NULL,
 object_path text NOT NULL,
 bucket_id text NOT NULL DEFAULT 'task-evidence',
 deleted boolean NOT NULL DEFAULT false,
 attempts integer NOT NULL DEFAULT 0,
 last_error text,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (deletion_id,object_path)
);
CREATE INDEX IF NOT EXISTS work_shop_deleted_media_pending
 ON public.work_shop_deleted_media(created_at)
 WHERE deleted=false;
ALTER TABLE public.work_shop_deleted_media ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.work_shop_deleted_media FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.work_shop_deleted_media TO service_role;

CREATE OR REPLACE FUNCTION public.work_delete_shop_permanently(p_shop uuid,p_actor uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 v_code text;
 v_primary boolean;
 v_deletion uuid:=gen_random_uuid();
 v_members bigint;
 v_tasks bigint;
 v_inventory bigint;
 v_media bigint;
BEGIN
 IF p_actor IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id=p_actor AND p.employee_code='112191'
   AND p.is_admin=true AND p.role='manager'
   AND p.active=true AND p.must_change_password=false
 ) THEN RAISE EXCEPTION 'Chỉ Super Admin 112191 được xóa SHOP';
 END IF;
 SELECT shop_code,is_primary INTO v_code,v_primary
 FROM public.work_shops WHERE id=p_shop FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'SHOP không còn tồn tại'; END IF;
 IF v_primary THEN
  RAISE EXCEPTION 'Không thể xóa SHOP chính đang giữ mặc định của hệ thống';
 END IF;

 SELECT count(*) INTO v_members FROM public.work_shop_memberships WHERE shop_id=p_shop;
 SELECT count(*) INTO v_tasks FROM public.tasks WHERE shop_id=p_shop;
 SELECT count(*) INTO v_inventory FROM public.inventory_sessions WHERE shop_id=p_shop;

 INSERT INTO public.work_shop_deleted_media(deletion_id,object_path)
 SELECT DISTINCT v_deletion, btrim(photo)
 FROM public.assignments a
 CROSS JOIN LATERAL unnest(coalesce(a.photo_paths,ARRAY[]::text[])) photo
 WHERE a.shop_id=p_shop AND btrim(photo)<>''
 ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS v_media=ROW_COUNT;

 -- Foreign keys on inventory_* are RESTRICT: delete children first.
 DELETE FROM public.inventory_counts WHERE shop_id=p_shop;
 DELETE FROM public.inventory_stock WHERE shop_id=p_shop;
 DELETE FROM public.inventory_sessions WHERE shop_id=p_shop;
 -- Notifications may refer to tasks or assignments. Delete before parents.
 DELETE FROM public.notifications WHERE shop_id=p_shop;
 DELETE FROM public.assignments WHERE shop_id=p_shop;
 DELETE FROM public.recurring_members WHERE shop_id=p_shop;
 DELETE FROM public.tasks WHERE shop_id=p_shop;
 DELETE FROM public.recurring_templates WHERE shop_id=p_shop;
 DELETE FROM public.work_shop_memberships WHERE shop_id=p_shop;

 INSERT INTO public.work_shop_action_audit(shop_id,actor_id,target_id,action)
 VALUES(p_shop,p_actor,NULL,'delete_shop_permanently');

 DELETE FROM public.work_shops WHERE id=p_shop;
 IF NOT FOUND THEN RAISE EXCEPTION 'Xóa SHOP không thành công'; END IF;

 RETURN jsonb_build_object('deleted',true,'deletion_id',v_deletion,
  'shop_code',v_code,'memberships_removed',v_members,'tasks_removed',v_tasks,
  'inventory_sessions_removed',v_inventory,'media_pending',v_media);
END $$;
REVOKE ALL ON FUNCTION public.work_delete_shop_permanently(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.work_delete_shop_permanently(uuid,uuid) TO service_role;
COMMIT;
