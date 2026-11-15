-- 112191 WORK / KIỂM KÊ 4.0 / 2026-11-15.
-- One independently secured inventory session per shop/stock-taking round.
-- Browser has SELECT-only access; mutations use authorized atomic RPCs.
BEGIN;
CREATE TABLE IF NOT EXISTS public.inventory_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 shop_id uuid NOT NULL REFERENCES public.work_shops(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 2 AND 150),
 state text NOT NULL DEFAULT 'importing'
   CHECK(state IN ('importing','open','closed')),
 source_filename text,
 created_by uuid NOT NULL REFERENCES public.profiles(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 closed_at timestamptz
);
CREATE INDEX IF NOT EXISTS inventory_sessions_shop_created
 ON public.inventory_sessions(shop_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.inventory_stock (
 session_id uuid NOT NULL REFERENCES public.inventory_sessions(id) ON DELETE RESTRICT,
 shop_id uuid NOT NULL REFERENCES public.work_shops(id) ON DELETE RESTRICT,
 product_code text NOT NULL CHECK(length(product_code) BETWEEN 1 AND 100),
 product_name text NOT NULL DEFAULT 'CHƯA CÓ TRONG DANH MỤC',
 expected_qty integer NOT NULL CHECK(expected_qty BETWEEN 0 AND 100000000),
 PRIMARY KEY(session_id,product_code)
);
CREATE INDEX IF NOT EXISTS inventory_stock_shop_session ON public.inventory_stock(shop_id,session_id);
CREATE TABLE IF NOT EXISTS public.inventory_counts (
 session_id uuid NOT NULL REFERENCES public.inventory_sessions(id) ON DELETE RESTRICT,
 shop_id uuid NOT NULL REFERENCES public.work_shops(id) ON DELETE RESTRICT,
 product_code text NOT NULL CHECK(length(product_code) BETWEEN 1 AND 100),
 product_name text NOT NULL DEFAULT 'CHƯA CÓ TRONG DANH MỤC',
 counted_qty integer NOT NULL DEFAULT 0 CHECK(counted_qty BETWEEN 0 AND 100000000),
 updated_by uuid REFERENCES public.profiles(id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(session_id,product_code)
);
CREATE INDEX IF NOT EXISTS inventory_counts_shop_session ON public.inventory_counts(shop_id,session_id);
ALTER TABLE public.inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory_sessions,public.inventory_stock,public.inventory_counts FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.inventory_sessions,public.inventory_stock,public.inventory_counts TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.inventory_sessions,public.inventory_stock,public.inventory_counts TO service_role;
DROP POLICY IF EXISTS inventory_sessions_read_shop ON public.inventory_sessions;
CREATE POLICY inventory_sessions_read_shop ON public.inventory_sessions FOR SELECT TO authenticated
 USING (public.work_can_access_shop(shop_id));
DROP POLICY IF EXISTS inventory_stock_read_shop ON public.inventory_stock;
CREATE POLICY inventory_stock_read_shop ON public.inventory_stock FOR SELECT TO authenticated
 USING (public.work_can_access_shop(shop_id));
DROP POLICY IF EXISTS inventory_counts_read_shop ON public.inventory_counts;
CREATE POLICY inventory_counts_read_shop ON public.inventory_counts FOR SELECT TO authenticated
 USING (public.work_can_access_shop(shop_id));

CREATE OR REPLACE FUNCTION public.inventory_create_session(p_shop uuid,p_title text,p_filename text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid;
BEGIN
 IF (select auth.uid()) IS NULL OR NOT public.work_can_manage_shop(p_shop) THEN
  RAISE EXCEPTION 'Bạn không được tạo kỳ kiểm kê tại SHOP này';
 END IF;
 IF length(btrim(coalesce(p_title,''))) NOT BETWEEN 2 AND 150 THEN
  RAISE EXCEPTION 'Tên kỳ kiểm kê chưa hợp lệ';
 END IF;
 INSERT INTO public.inventory_sessions(shop_id,title,source_filename,created_by)
 VALUES(p_shop,btrim(p_title),left(p_filename,255),(select auth.uid()))
 RETURNING id INTO v_id;
 RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.inventory_import_batch(p_session uuid,p_items jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_shop uuid;v_state text;v_item jsonb;v_code text;v_name text;v_qty_text text;v_qty integer;v_rows integer:=0;
BEGIN
 SELECT shop_id,state INTO v_shop,v_state FROM public.inventory_sessions WHERE id=p_session;
 IF v_shop IS NULL OR NOT public.work_can_manage_shop(v_shop) OR v_state<>'importing' THEN
  RAISE EXCEPTION 'Không có quyền nhập tồn kho hoặc kỳ đã chốt nhập';
 END IF;
 IF p_items IS NULL OR jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 250 THEN
  RAISE EXCEPTION 'Mỗi lần nhập phải có 1–250 sản phẩm';
 END IF;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
   v_code:=btrim(coalesce(v_item->>'code',''));
   v_name:=btrim(coalesce(v_item->>'name',''));
   v_qty_text:=coalesce(v_item->>'qty','');
   IF length(v_code) NOT BETWEEN 1 AND 100 OR v_code ~ '[[:cntrl:]]'
     OR v_qty_text !~ '^[0-9]{1,9}$' THEN
     RAISE EXCEPTION 'Mã sản phẩm hoặc số lượng tồn không hợp lệ';
   END IF;
   v_qty:=v_qty_text::integer;
   IF v_qty>100000000 THEN RAISE EXCEPTION 'Số lượng vượt giới hạn';END IF;
   IF v_name='' THEN v_name:='CHƯA CÓ TRONG DANH MỤC';END IF;
   INSERT INTO public.inventory_stock(session_id,shop_id,product_code,product_name,expected_qty)
   VALUES(p_session,v_shop,v_code,left(v_name,300),v_qty)
   ON CONFLICT (session_id,product_code) DO UPDATE SET
    product_name=EXCLUDED.product_name,expected_qty=EXCLUDED.expected_qty;
   v_rows:=v_rows+1;
 END LOOP;
 RETURN v_rows;
END $$;

CREATE OR REPLACE FUNCTION public.inventory_finish_import(p_session uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_shop uuid;v_state text;v_count integer;
BEGIN
 SELECT shop_id,state INTO v_shop,v_state FROM public.inventory_sessions WHERE id=p_session FOR UPDATE;
 IF v_shop IS NULL OR NOT public.work_can_manage_shop(v_shop) OR v_state<>'importing' THEN
  RAISE EXCEPTION 'Không thể hoàn tất nhập tồn kho';
 END IF;
 SELECT count(*) INTO v_count FROM public.inventory_stock WHERE session_id=p_session;
 IF v_count=0 THEN RAISE EXCEPTION 'Chưa có dữ liệu tồn kho';END IF;
 UPDATE public.inventory_sessions SET state='open',updated_at=now() WHERE id=p_session;
 RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION public.inventory_scan(p_session uuid,p_code text,p_name text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_shop uuid;v_state text;v_code text;v_expected integer:=0;v_name text;v_total integer;
BEGIN
 SELECT shop_id,state INTO v_shop,v_state FROM public.inventory_sessions WHERE id=p_session;
 IF v_shop IS NULL OR v_state<>'open' OR NOT public.work_can_access_shop(v_shop) THEN
  RAISE EXCEPTION 'Kỳ kiểm kê không hoạt động hoặc bạn không thuộc SHOP';
 END IF;
 v_code:=btrim(coalesce(p_code,''));
 IF length(v_code) NOT BETWEEN 1 AND 100 OR v_code ~ '[[:cntrl:]]' THEN
  RAISE EXCEPTION 'Mã quét không hợp lệ';
 END IF;
 SELECT expected_qty,product_name INTO v_expected,v_name
 FROM public.inventory_stock WHERE session_id=p_session AND product_code=v_code;
 v_expected:=coalesce(v_expected,0);
 IF v_name IS NULL OR v_name='CHƯA CÓ TRONG DANH MỤC' THEN
  v_name:=coalesce(nullif(left(btrim(coalesce(p_name,'')),300),''),'CHƯA CÓ TRONG DANH MỤC');
 END IF;
 INSERT INTO public.inventory_counts(session_id,shop_id,product_code,product_name,counted_qty,updated_by)
 VALUES(p_session,v_shop,v_code,v_name,1,(select auth.uid()))
 ON CONFLICT (session_id,product_code) DO UPDATE SET
 counted_qty=public.inventory_counts.counted_qty+1,
 product_name=CASE WHEN public.inventory_counts.product_name='CHƯA CÓ TRONG DANH MỤC' THEN EXCLUDED.product_name ELSE public.inventory_counts.product_name END,
 updated_by=EXCLUDED.updated_by,updated_at=now()
 RETURNING counted_qty INTO v_total;
 RETURN jsonb_build_object('product_code',v_code,'product_name',v_name,'counted_qty',v_total,'expected_qty',v_expected);
END $$;

CREATE OR REPLACE FUNCTION public.inventory_adjust_count(p_session uuid,p_code text,p_quantity integer,p_name text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_shop uuid;v_state text;v_code text;v_name text;
BEGIN
 SELECT shop_id,state INTO v_shop,v_state FROM public.inventory_sessions WHERE id=p_session;
 IF v_shop IS NULL OR v_state<>'open' OR NOT public.work_can_manage_shop(v_shop) THEN
  RAISE EXCEPTION 'Chỉ Quản lý được sửa số lượng kiểm đếm';
 END IF;
 v_code:=btrim(coalesce(p_code,''));
 IF length(v_code) NOT BETWEEN 1 AND 100 OR p_quantity IS NULL OR p_quantity NOT BETWEEN 0 AND 100000000 THEN
  RAISE EXCEPTION 'Mã hoặc số lượng không hợp lệ';
 END IF;
 SELECT product_name INTO v_name FROM public.inventory_stock WHERE session_id=p_session AND product_code=v_code;
 v_name:=coalesce(nullif(btrim(coalesce(p_name,'')),''),
   v_name,'CHƯA CÓ TRONG DANH MỤC');
 INSERT INTO public.inventory_counts(session_id,shop_id,product_code,product_name,counted_qty,updated_by)
 VALUES(p_session,v_shop,v_code,left(v_name,300),p_quantity,(select auth.uid()))
 ON CONFLICT (session_id,product_code) DO UPDATE SET
  counted_qty=EXCLUDED.counted_qty,product_name=EXCLUDED.product_name,
  updated_by=EXCLUDED.updated_by,updated_at=now();
END $$;

CREATE OR REPLACE FUNCTION public.inventory_close_session(p_session uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_shop uuid;v_state text;
BEGIN
 SELECT shop_id,state INTO v_shop,v_state FROM public.inventory_sessions WHERE id=p_session FOR UPDATE;
 IF v_shop IS NULL OR NOT public.work_can_manage_shop(v_shop) OR v_state<>'open' THEN
  RAISE EXCEPTION 'Không có quyền khóa kỳ kiểm kê';
 END IF;
 UPDATE public.inventory_sessions SET state='closed',closed_at=now(),updated_at=now() WHERE id=p_session;
END $$;

REVOKE ALL ON FUNCTION public.inventory_create_session(uuid,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.inventory_import_batch(uuid,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.inventory_finish_import(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.inventory_scan(uuid,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.inventory_adjust_count(uuid,text,integer,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.inventory_close_session(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.inventory_create_session(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_import_batch(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_finish_import(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_scan(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_adjust_count(uuid,text,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_close_session(uuid) TO authenticated;
COMMIT;