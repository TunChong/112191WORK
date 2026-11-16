BEGIN;
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
 IF v_url IS NOT NULL AND (v_url !~ '^https://[^[:space:]]+$' OR char_length(v_url)>1000)
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
COMMIT;