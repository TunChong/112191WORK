-- KIỂM KÊ 4.0 · quản lý vòng đời kỳ kiểm kê, SHOP-scoped and atomic.
-- Hoàn tất = close (existing inventory_close_session); Mở khóa = reopen;
-- Xóa kỳ = permanently delete ONLY this session's stock and counts.
BEGIN;
CREATE OR REPLACE FUNCTION public.inventory_reopen_session(p_session uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_shop uuid;v_state text;
BEGIN
 IF (select auth.uid()) IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập'; END IF;
 SELECT shop_id,state INTO v_shop,v_state
 FROM public.inventory_sessions WHERE id=p_session FOR UPDATE;
 IF v_shop IS NULL OR NOT public.work_can_manage_shop(v_shop) THEN
  RAISE EXCEPTION 'Không có quyền mở khóa kỳ kiểm kê';
 END IF;
 IF v_state<>'closed' THEN
  RAISE EXCEPTION 'Chỉ mở khóa được kỳ kiểm kê đã hoàn tất';
 END IF;
 UPDATE public.inventory_sessions SET state='open',closed_at=NULL,updated_at=now()
 WHERE id=p_session;
END $fn$;

CREATE OR REPLACE FUNCTION public.inventory_delete_session(p_session uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_shop uuid;v_state text;v_stock bigint;v_counts bigint;v_title text;
BEGIN
 IF (select auth.uid()) IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập';END IF;
 SELECT shop_id,state,title INTO v_shop,v_state,v_title
 FROM public.inventory_sessions WHERE id=p_session FOR UPDATE;
 IF v_shop IS NULL OR NOT public.work_can_manage_shop(v_shop) THEN
  RAISE EXCEPTION 'Không có quyền xóa kỳ kiểm kê của SHOP này';
 END IF;
 SELECT count(*) INTO v_counts FROM public.inventory_counts WHERE session_id=p_session;
 SELECT count(*) INTO v_stock FROM public.inventory_stock WHERE session_id=p_session;
 DELETE FROM public.inventory_counts WHERE session_id=p_session AND shop_id=v_shop;
 DELETE FROM public.inventory_stock WHERE session_id=p_session AND shop_id=v_shop;
 DELETE FROM public.inventory_sessions WHERE id=p_session AND shop_id=v_shop;
 IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy kỳ kiểm kê cần xóa'; END IF;
 RETURN jsonb_build_object('deleted',true,'title',v_title,'shop_id',v_shop,
  'stock_rows_deleted',v_stock,'count_rows_deleted',v_counts);
END $fn$;
REVOKE ALL ON FUNCTION public.inventory_reopen_session(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.inventory_delete_session(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.inventory_reopen_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_delete_session(uuid) TO authenticated;
COMMIT;