-- Companion-MWG / MWGX v3.6.0 PREVIEW
-- ADD-ONLY. Does NOT touch or reset existing APP tables, users or storage.
-- Deploy only AFTER backup, access review and green regression tests.
-- Revert application safely by removing MWGX routes; keep history tables intact.
BEGIN;
CREATE TABLE IF NOT EXISTS public.mwgx_cash_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shop_id uuid NOT NULL REFERENCES public.work_shops(id),
 created_by uuid NOT NULL REFERENCES public.profiles(id),
 count_date date NOT NULL,
 count_time time NOT NULL,
 shift_label text NOT NULL DEFAULT '' CHECK(length(shift_label)<=80),
 counted_by_name text NOT NULL CHECK(length(counted_by_name)<=160),
 erp_amount bigint NOT NULL CHECK(erp_amount BETWEEN 0 AND 1000000000000000),
 actual_amount bigint NOT NULL CHECK(actual_amount BETWEEN 0 AND 1000000000000000),
 variance bigint NOT NULL CHECK(variance=actual_amount-erp_amount),
 denominations jsonb NOT NULL CHECK(jsonb_typeof(denominations)='array'),
 explanation text NOT NULL DEFAULT '' CHECK(length(explanation)<=2000),
 confirmation_name text CHECK(length(confirmation_name)<=160),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed')),
 confirmed_by uuid REFERENCES public.profiles(id),
 confirmed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT mwgx_cash_confirm_check CHECK ((status='pending' AND confirmed_by IS NULL AND confirmed_at IS NULL) OR (status='confirmed' AND confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL)),
 CONSTRAINT mwgx_cash_explain_check CHECK(variance=0 OR length(btrim(explanation))>=5)
);
CREATE INDEX IF NOT EXISTS mwgx_cash_shop_date_idx ON public.mwgx_cash_records(shop_id,count_date DESC,created_at DESC);
CREATE TABLE IF NOT EXISTS public.mwgx_print_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shop_id uuid NOT NULL REFERENCES public.work_shops(id),
 created_by uuid NOT NULL REFERENCES public.profiles(id),
 module text NOT NULL CHECK(module IN ('print_studio','warehouse')),
 template_id text NOT NULL CHECK(length(template_id) BETWEEN 1 AND 140),
 action text NOT NULL CHECK(action IN ('print','png300','png2k')),
 payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(payload)='object'),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mwgx_print_shop_time_idx ON public.mwgx_print_jobs(shop_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.mwgx_accessory_checks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shop_id uuid NOT NULL REFERENCES public.work_shops(id),
 created_by uuid NOT NULL REFERENCES public.profiles(id),
 product_code text NOT NULL CHECK(length(product_code) BETWEEN 1 AND 100),
 product_name text NOT NULL DEFAULT '' CHECK(length(product_name)<=300),
 accessory_type text NOT NULL CHECK(length(accessory_type) BETWEEN 1 AND 160),
 expected_qty integer NOT NULL CHECK(expected_qty BETWEEN 0 AND 1000000),
 actual_qty integer NOT NULL CHECK(actual_qty BETWEEN 0 AND 1000000),
 checked_on date NOT NULL,
 notes text NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mwgx_accessory_shop_time_idx ON public.mwgx_accessory_checks(shop_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.mwgx_sales_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shop_id uuid NOT NULL REFERENCES public.work_shops(id),
 created_by uuid NOT NULL REFERENCES public.profiles(id),
 form_type text NOT NULL CHECK(form_type IN ('installment','insurance','payment','warranty')),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object'),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT mwgx_sales_no_secret CHECK(NOT (data ?| ARRAY['secret','password','passcode','otp','userCode']))
);
CREATE INDEX IF NOT EXISTS mwgx_sales_shop_time_idx ON public.mwgx_sales_records(shop_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.mwgx_printer_profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shop_id uuid NOT NULL REFERENCES public.work_shops(id),
 user_id uuid NOT NULL REFERENCES public.profiles(id),
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
 settings jsonb NOT NULL CHECK(jsonb_typeof(settings)='object'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(shop_id,user_id,name)
);
CREATE INDEX IF NOT EXISTS mwgx_printers_shop_user_idx ON public.mwgx_printer_profiles(shop_id,user_id);

ALTER TABLE public.mwgx_cash_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mwgx_print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mwgx_accessory_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mwgx_sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mwgx_printer_profiles ENABLE ROW LEVEL SECURITY;
-- Do not grant broad write or public table access.
REVOKE ALL ON public.mwgx_cash_records,public.mwgx_print_jobs,public.mwgx_accessory_checks,public.mwgx_sales_records,public.mwgx_printer_profiles FROM anon;
GRANT SELECT,INSERT ON public.mwgx_cash_records, public.mwgx_print_jobs, public.mwgx_accessory_checks, public.mwgx_sales_records TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.mwgx_printer_profiles TO authenticated;

-- All policies are shop-scoped. Only own records may be created. No DELETE policies.
CREATE POLICY mwgx_cash_read ON public.mwgx_cash_records FOR SELECT TO authenticated USING(public.work_can_access_shop(shop_id));
CREATE POLICY mwgx_cash_create ON public.mwgx_cash_records FOR INSERT TO authenticated WITH CHECK(created_by=(select auth.uid()) AND public.work_can_access_shop(shop_id) AND status='pending' AND confirmed_by IS NULL);
CREATE POLICY mwgx_print_read ON public.mwgx_print_jobs FOR SELECT TO authenticated USING(public.work_can_access_shop(shop_id));
CREATE POLICY mwgx_print_create ON public.mwgx_print_jobs FOR INSERT TO authenticated WITH CHECK(created_by=(select auth.uid()) AND public.work_can_access_shop(shop_id));
CREATE POLICY mwgx_accessories_read ON public.mwgx_accessory_checks FOR SELECT TO authenticated USING(public.work_can_access_shop(shop_id));
CREATE POLICY mwgx_accessories_create ON public.mwgx_accessory_checks FOR INSERT TO authenticated WITH CHECK(created_by=(select auth.uid()) AND public.work_can_access_shop(shop_id));
CREATE POLICY mwgx_sales_read ON public.mwgx_sales_records FOR SELECT TO authenticated USING(public.work_can_access_shop(shop_id));
CREATE POLICY mwgx_sales_create ON public.mwgx_sales_records FOR INSERT TO authenticated WITH CHECK(created_by=(select auth.uid()) AND public.work_can_access_shop(shop_id));
CREATE POLICY mwgx_printer_read ON public.mwgx_printer_profiles FOR SELECT TO authenticated USING(user_id=(select auth.uid()) AND public.work_can_access_shop(shop_id));
CREATE POLICY mwgx_printer_insert ON public.mwgx_printer_profiles FOR INSERT TO authenticated WITH CHECK(user_id=(select auth.uid()) AND public.work_can_access_shop(shop_id));
CREATE POLICY mwgx_printer_update ON public.mwgx_printer_profiles FOR UPDATE TO authenticated USING(user_id=(select auth.uid()) AND public.work_can_access_shop(shop_id)) WITH CHECK(user_id=(select auth.uid()) AND public.work_can_access_shop(shop_id));

CREATE OR REPLACE FUNCTION public.mwgx_confirm_cash(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $mwgx$
DECLARE v_shop uuid;v_status text;
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
 SELECT shop_id,status INTO v_shop,v_status FROM public.mwgx_cash_records WHERE id=p_id FOR UPDATE;
 IF v_shop IS NULL OR NOT public.work_can_manage_shop(v_shop) THEN RAISE EXCEPTION 'Chỉ Quản lý SHOP được xác nhận kiểm quỹ'; END IF;
 IF v_status <> 'pending' THEN RAISE EXCEPTION 'Biên bản đã xác nhận'; END IF;
 UPDATE public.mwgx_cash_records SET status='confirmed',confirmed_by=(select auth.uid()),confirmed_at=now() WHERE id=p_id;
 RETURN jsonb_build_object('ok',true,'id',p_id);
END $mwgx$;
REVOKE ALL ON FUNCTION public.mwgx_confirm_cash(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mwgx_confirm_cash(uuid) TO authenticated;
COMMIT;
