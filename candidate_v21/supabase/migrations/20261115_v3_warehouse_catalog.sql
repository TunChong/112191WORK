-- 112191 WORK v3.0.2 (2026-11-15) - stable warehouse code labels and safe catalog.
-- Additive migration for previously initialized v3 database; preserves all existing IDs.
BEGIN;
ALTER TABLE public.work_shops
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;
UPDATE public.work_shops
 SET is_primary=true
 WHERE shop_code IN ('102','97')
   AND NOT EXISTS (SELECT 1 FROM public.work_shops p WHERE p.is_primary=true);
CREATE UNIQUE INDEX IF NOT EXISTS work_shops_one_primary
 ON public.work_shops(is_primary) WHERE is_primary=true;
CREATE OR REPLACE FUNCTION public.work_default_shop_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT id FROM public.work_shops WHERE is_primary=true LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.work_default_shop_id() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.work_default_shop_id() TO authenticated,service_role;
UPDATE public.work_shops SET shop_code='97', shop_name='ĐMX 102 LÊ VĂN KHƯƠNG',
 updated_at=now() WHERE is_primary=true AND shop_code IN ('102','97');

-- Before row-level isolation is approved, a newly created SHOP remains an inactive
-- catalog entry and cannot receive tasks or recurring templates. The original shop
-- can continue its normal single-shop operation.
CREATE OR REPLACE FUNCTION public.work_v3_gate_new_shop_data()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_primary boolean; v_ready boolean;
BEGIN
 SELECT s.is_primary INTO v_primary FROM public.work_shops s WHERE s.id=NEW.shop_id;
 IF v_primary IS NULL THEN RAISE EXCEPTION 'Không tìm thấy SHOP hợp lệ';END IF;
 SELECT c.isolation_ready INTO v_ready FROM public.work_multi_shop_config c WHERE c.key='production';
 IF NOT v_primary AND v_ready IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'SHOP mới chưa được mở vận hành; dữ liệu nhiều SHOP đang kiểm thử bảo mật';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS work_gate_tasks_nonprimary ON public.tasks;
CREATE TRIGGER work_gate_tasks_nonprimary BEFORE INSERT ON public.tasks
 FOR EACH ROW EXECUTE FUNCTION public.work_v3_gate_new_shop_data();
DROP TRIGGER IF EXISTS work_gate_templates_nonprimary ON public.recurring_templates;
CREATE TRIGGER work_gate_templates_nonprimary BEFORE INSERT ON public.recurring_templates
 FOR EACH ROW EXECUTE FUNCTION public.work_v3_gate_new_shop_data();
REVOKE ALL ON FUNCTION public.work_v3_gate_new_shop_data() FROM PUBLIC,anon,authenticated;
COMMIT;

-- Follow-up: redeploy manage-staff to query work_shops.is_primary, not shop_code='102'.
-- Follow-up: add/edit/archive/delete EMPTY shops via Admin-only manage-shops API;
-- other manager/staff and task operations stay locked by isolation_ready=false.
