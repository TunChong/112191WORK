-- 112191 WORK v3.0 / phase 1. Applied to existing Supabase project 2026-11-15.
-- Additive only. Old tasks, users, storage and RLS policies stay unchanged.
-- DO NOT enable multi-shop onboarding until phase 2 row isolation is deployed and tested.
BEGIN;
CREATE TABLE IF NOT EXISTS public.work_shops (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shop_code text NOT NULL UNIQUE CHECK (length(shop_code) BETWEEN 2 AND 32 AND shop_code ~ '^[A-Za-z0-9_-]+$'),
 shop_name text NOT NULL CHECK (length(trim(shop_name)) BETWEEN 3 AND 160),
 active boolean NOT NULL DEFAULT true,
 created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.work_shop_memberships (
 shop_id uuid NOT NULL REFERENCES public.work_shops(id) ON DELETE RESTRICT,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 shop_role text NOT NULL CHECK (shop_role IN ('manager','shift_lead','staff')),
 active boolean NOT NULL DEFAULT true,
 granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(shop_id,user_id)
);
CREATE INDEX IF NOT EXISTS work_shop_memberships_by_user ON public.work_shop_memberships(user_id,active,shop_id);
CREATE INDEX IF NOT EXISTS work_shop_memberships_by_shop ON public.work_shop_memberships(shop_id,shop_role,active,user_id);

CREATE OR REPLACE FUNCTION public.work_is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles
 WHERE id = (select auth.uid()) AND employee_code='112191' AND is_admin
 AND role='manager' AND active AND NOT must_change_password) $$;
CREATE OR REPLACE FUNCTION public.work_can_access_shop(p_shop uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT public.work_is_super_admin() OR EXISTS(
 SELECT 1 FROM public.work_shop_memberships m JOIN public.work_shops s ON s.id=m.shop_id
 JOIN public.profiles p ON p.id=m.user_id
 WHERE m.user_id=(select auth.uid()) AND m.shop_id=p_shop AND m.active AND s.active
 AND p.active AND NOT p.must_change_password) $$;
CREATE OR REPLACE FUNCTION public.work_can_manage_shop(p_shop uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT public.work_is_super_admin() OR EXISTS(
 SELECT 1 FROM public.work_shop_memberships m JOIN public.work_shops s ON s.id=m.shop_id
 JOIN public.profiles p ON p.id=m.user_id
 WHERE m.user_id=(select auth.uid()) AND m.shop_id=p_shop AND m.shop_role='manager'
 AND m.active AND s.active AND p.active AND NOT p.must_change_password) $$;
CREATE OR REPLACE FUNCTION public.work_can_supervise_shop(p_shop uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT public.work_is_super_admin() OR EXISTS(
 SELECT 1 FROM public.work_shop_memberships m JOIN public.work_shops s ON s.id=m.shop_id
 JOIN public.profiles p ON p.id=m.user_id
 WHERE m.user_id=(select auth.uid()) AND m.shop_id=p_shop
 AND m.shop_role IN ('manager','shift_lead') AND m.active AND s.active AND p.active
 AND NOT p.must_change_password) $$;
REVOKE ALL ON FUNCTION public.work_is_super_admin() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.work_can_access_shop(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.work_can_manage_shop(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.work_can_supervise_shop(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.work_is_super_admin() TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.work_can_access_shop(uuid) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.work_can_manage_shop(uuid) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.work_can_supervise_shop(uuid) TO authenticated,service_role;

ALTER TABLE public.work_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shop_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.work_shops,public.work_shop_memberships FROM PUBLIC,anon;
GRANT SELECT ON public.work_shops,public.work_shop_memberships TO authenticated,service_role;
DROP POLICY IF EXISTS work_shops_view ON public.work_shops;
CREATE POLICY work_shops_view ON public.work_shops FOR SELECT TO authenticated
USING (public.work_can_access_shop(id));
DROP POLICY IF EXISTS work_shop_memberships_view ON public.work_shop_memberships;
CREATE POLICY work_shop_memberships_view ON public.work_shop_memberships FOR SELECT TO authenticated
USING (user_id=(select auth.uid()) OR public.work_can_manage_shop(shop_id));

INSERT INTO public.work_shops(shop_code,shop_name,created_by)
 SELECT '102','ĐMX 102 Lê Văn Khương',id FROM public.profiles
 WHERE employee_code='112191' AND is_admin=true
 ON CONFLICT (shop_code) DO NOTHING;
INSERT INTO public.work_shop_memberships(shop_id,user_id,shop_role,granted_by)
 SELECT s.id,p.id,'manager',p.id FROM public.work_shops s CROSS JOIN public.profiles p
 WHERE s.shop_code='102' AND p.employee_code='112191' AND p.is_admin
 ON CONFLICT (shop_id,user_id) DO NOTHING;
COMMIT;
