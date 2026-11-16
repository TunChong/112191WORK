-- Companion-MWG / Audio service requests.
-- Scoped by logged-in requester and global Super Admin; payment is manually verified.
BEGIN;
CREATE TABLE IF NOT EXISTS public.companion_audio_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shop_id uuid NOT NULL REFERENCES public.work_shops(id) ON DELETE CASCADE,
 requester_id uuid NOT NULL REFERENCES public.profiles(id),
 shop_label text NOT NULL,
 request_script text NOT NULL CHECK (char_length(request_script) BETWEEN 100 AND 3000),
 form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
 contact_platform text NOT NULL CHECK (contact_platform IN ('ZALO','LINE')),
 contact_value text NOT NULL CHECK (char_length(contact_value) BETWEEN 3 AND 120),
 price_vnd integer NOT NULL DEFAULT 49000 CHECK (price_vnd=49000),
 customer_claimed_payment boolean NOT NULL DEFAULT false,
 payment_verified boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','processing','delivered','cancelled')),
 delivery_url text,
 admin_note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 delivered_at timestamptz
);
CREATE INDEX IF NOT EXISTS companion_audio_orders_shop_created
 ON public.companion_audio_orders(shop_id,created_at DESC);
CREATE INDEX IF NOT EXISTS companion_audio_orders_requester
 ON public.companion_audio_orders(requester_id,created_at DESC);
ALTER TABLE public.companion_audio_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.companion_audio_orders FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.companion_audio_orders TO authenticated;
GRANT ALL ON public.companion_audio_orders TO service_role;
DROP POLICY IF EXISTS companion_audio_orders_read ON public.companion_audio_orders;
CREATE POLICY companion_audio_orders_read ON public.companion_audio_orders FOR SELECT TO authenticated
USING (
 requester_id=(SELECT auth.uid())
 OR EXISTS(
  SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid())
    AND p.is_admin AND p.employee_code='112191' AND p.active
 )
);

CREATE OR REPLACE FUNCTION public.companion_submit_audio(
 p_shop uuid,p_script text,p_details jsonb,p_contact_platform text,p_contact_value text,p_claimed_paid boolean
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_uid uuid:=auth.uid();v_shop text;v_order uuid;v_admin uuid;v_words int;
BEGIN
 IF v_uid IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.profiles p
  WHERE p.id=v_uid AND p.active AND NOT p.must_change_password
 ) THEN RAISE EXCEPTION 'Cần đăng nhập tài khoản đang hoạt động'; END IF;
 IF NOT public.work_can_access_shop(p_shop) THEN
  RAISE EXCEPTION 'Không có quyền gửi yêu cầu cho SHOP này'; END IF;
 SELECT s.shop_code||' - '||s.shop_name INTO v_shop
 FROM public.work_shops s WHERE s.id=p_shop AND s.active=true;
 IF v_shop IS NULL THEN RAISE EXCEPTION 'SHOP đang không hoạt động';END IF;
 IF char_length(btrim(coalesce(p_script,''))) NOT BETWEEN 100 AND 3000
 THEN RAISE EXCEPTION 'Kịch bản phải dài 100–3000 ký tự'; END IF;
 v_words:=coalesce(array_length(regexp_split_to_array(btrim(p_script),'\s+'),1),0);
 IF v_words>450 THEN RAISE EXCEPTION 'Kịch bản vượt giới hạn 3 phút (tối đa khoảng 450 từ)'; END IF;
 IF p_contact_platform NOT IN ('ZALO','LINE') OR char_length(btrim(coalesce(p_contact_value,''))) NOT BETWEEN 3 AND 120
 THEN RAISE EXCEPTION 'Vui lòng cung cấp Zalo hoặc LINE ID'; END IF;
 IF p_claimed_paid IS NOT TRUE THEN RAISE EXCEPTION 'Vui lòng xác nhận đã thực hiện chuyển khoản trước khi gửi'; END IF;
 IF octet_length(coalesce(p_details,'{}'::jsonb)::text)>10000 THEN RAISE EXCEPTION 'Thông tin chương trình quá dài';END IF;
 SELECT id INTO v_admin FROM public.profiles
 WHERE employee_code='112191' AND is_admin AND active LIMIT 1;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'Không tìm thấy Admin nhận yêu cầu'; END IF;
 INSERT INTO public.companion_audio_orders(
  shop_id,requester_id,shop_label,request_script,form_data,
  contact_platform,contact_value,customer_claimed_payment)
 VALUES(p_shop,v_uid,v_shop,btrim(p_script),coalesce(p_details,'{}'::jsonb),
        p_contact_platform,btrim(p_contact_value),true) RETURNING id INTO v_order;
 INSERT INTO public.notifications(recipient_id,title,body,event_key,shop_id)
 VALUES(v_admin,'Yêu cầu AUDIO 49K mới',
  v_shop||' vừa gửi yêu cầu Audio. Nhận qua '||p_contact_platform||' · Chờ kiểm tra thanh toán.',
  'audio:new:'||v_order::text,NULL);
 RETURN v_order;
END $$;
REVOKE ALL ON FUNCTION public.companion_submit_audio(uuid,text,jsonb,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.companion_submit_audio(uuid,text,jsonb,text,text,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.companion_manage_audio(
 p_order uuid,p_action text,p_delivery_url text DEFAULT NULL,p_admin_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_uid uuid:=auth.uid();v_order public.companion_audio_orders%ROWTYPE;
DECLARE v_status text;v_url text;
BEGIN
 IF v_uid IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.profiles p WHERE p.id=v_uid
   AND p.employee_code='112191' AND p.is_admin AND p.role='manager' AND p.active
   AND NOT p.must_change_password
 ) THEN RAISE EXCEPTION 'Chỉ Super Admin được xử lý yêu cầu Audio';END IF;
 SELECT * INTO v_order FROM public.companion_audio_orders
 WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy yêu cầu Audio';END IF;
 IF p_action NOT IN ('verify_payment','processing','delivered','cancelled')
 THEN RAISE EXCEPTION 'Trạng thái không hợp lệ';END IF;
 v_url:=nullif(btrim(coalesce(p_delivery_url,'')),'');
 IF v_url IS NOT NULL AND (v_url !~ '^https://[^[:space:]]{4,1000}$' OR char_length(v_url)>1000)
 THEN RAISE EXCEPTION 'Link Audio phải bắt đầu bằng https://';END IF;
 IF char_length(coalesce(p_admin_note,''))>1200
 THEN RAISE EXCEPTION 'Ghi chú quá dài'; END IF;
 IF p_action='delivered' AND NOT v_order.payment_verified
 THEN RAISE EXCEPTION 'Admin cần xác nhận đã nhận tiền trước khi hoàn tất Audio';END IF;
 v_status:=CASE WHEN p_action='verify_payment' THEN 'processing'
           ELSE p_action END;
 UPDATE public.companion_audio_orders
 SET status=v_status,
     payment_verified=CASE WHEN p_action='verify_payment' THEN true ELSE payment_verified END,
     delivery_url=coalesce(v_url,delivery_url),
     admin_note=coalesce(p_admin_note,admin_note),
     delivered_at=CASE WHEN p_action='delivered' THEN now() ELSE delivered_at END,
     updated_at=now()
 WHERE id=p_order;
 IF p_action IN ('verify_payment','delivered','cancelled') THEN
  INSERT INTO public.notifications(recipient_id,title,body,event_key,shop_id)
  VALUES(v_order.requester_id,
   CASE WHEN p_action='verify_payment' THEN 'Audio đã xác nhận thanh toán'
        WHEN p_action='delivered' THEN 'Audio đã hoàn tất' ELSE 'Yêu cầu Audio đã hủy' END,
   CASE WHEN p_action='verify_payment' THEN 'Đã xác nhận thanh toán 49.000đ. Admin đang thực hiện Audio.'
        WHEN p_action='delivered' THEN 'Bản Audio đã được xử lý. Vui lòng kiểm tra Zalo/LINE.' 
        ELSE 'Yêu cầu đã được cập nhật. Vui lòng liên hệ Admin để biết thêm.' END,
   'audio:'||p_action||':'||p_order::text,NULL);
 END IF;
 RETURN jsonb_build_object('ok',true,'status',v_status,'payment_verified',
   p_action='verify_payment' OR v_order.payment_verified);
END $$;
REVOKE ALL ON FUNCTION public.companion_manage_audio(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.companion_manage_audio(uuid,text,text,text) TO authenticated;
COMMIT;