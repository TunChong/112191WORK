-- 112191 WORK v3.2.1: remove an employee from exactly one SHOP atomically.
-- Super Admin 112191 has authority in all active / archived shops.
-- A delegated manager only has authority in their own active shop.
BEGIN;
CREATE OR REPLACE FUNCTION public.work_remove_member_permanently(p_shop uuid,p_target uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
 v_super boolean;
 v_actor_active boolean;
 v_shop_active boolean;
 v_target_role text;
 v_rest int;
 v_role text;
BEGIN
 SELECT p.active AND NOT p.must_change_password INTO v_actor_active
 FROM public.profiles p WHERE p.id=p_actor;
 IF NOT coalesce(v_actor_active,false) THEN
  RAISE EXCEPTION 'Tài khoản quản trị chưa hoạt động';
 END IF;
 SELECT p.employee_code='112191' AND p.is_admin AND p.role='manager'
 INTO v_super FROM public.profiles p WHERE p.id=p_actor;
 SELECT active INTO v_shop_active FROM public.work_shops WHERE id=p_shop FOR UPDATE;
 IF v_shop_active IS NULL THEN RAISE EXCEPTION 'SHOP không tồn tại'; END IF;
 IF NOT coalesce(v_super,false) AND NOT (
  v_shop_active=true AND EXISTS(
   SELECT 1 FROM public.work_shop_memberships m
   WHERE m.shop_id=p_shop AND m.user_id=p_actor AND m.active=true AND m.shop_role='manager'
  )
 ) THEN RAISE EXCEPTION 'Bạn không có quyền xóa nhân sự của SHOP này';END IF;

 IF p_actor=p_target THEN RAISE EXCEPTION 'Không thể xóa chính mình khỏi SHOP';END IF;
 PERFORM 1 FROM public.profiles p WHERE p.id=p_target FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Nhân sự không còn tồn tại';END IF;
 IF EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_target
           AND (p.is_admin OR p.employee_code='112191')) THEN
   RAISE EXCEPTION 'Không được xóa tài khoản Super Admin 112191';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.work_shop_memberships m
  WHERE m.shop_id=p_shop AND m.user_id=p_target) THEN
  RAISE EXCEPTION 'Nhân sự không còn thuộc SHOP';
 END IF;

 DELETE FROM public.work_shop_memberships WHERE shop_id=p_shop AND user_id=p_target;
 SELECT count(*), CASE WHEN bool_or(m.shop_role='manager') THEN 'manager'
         WHEN bool_or(m.shop_role='shift_lead') THEN 'shift_lead' ELSE 'staff' END
 INTO v_rest,v_role FROM public.work_shop_memberships m
 WHERE m.user_id=p_target AND m.active=true;
 UPDATE public.profiles SET role=coalesce(v_role,'staff') WHERE id=p_target;
 INSERT INTO public.work_shop_action_audit(shop_id,actor_id,target_id,action)
 VALUES(p_shop,p_actor,p_target,'remove_member_permanently');

 RETURN jsonb_build_object('ok',true,'removed',true,'other_shops_active',v_rest);
END $$;
REVOKE ALL ON FUNCTION public.work_remove_member_permanently(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.work_remove_member_permanently(uuid,uuid,uuid) TO service_role;
COMMIT;