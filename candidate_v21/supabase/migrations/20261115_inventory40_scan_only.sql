-- Kiểm kê 4.0: nhân viên và quản lý chỉ được ghi số lượng bằng hành động quét +1.
-- Không cấp API nhập trực tiếp hoặc sửa tổng số lượng.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.inventory_adjust_count(uuid,text,integer,text) FROM authenticated,anon,PUBLIC;
COMMIT;