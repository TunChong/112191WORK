-- Báo giá: cache tên/ảnh công khai của sản phẩm, không lưu dữ liệu khách hàng.
-- Mỗi dòng dùng một URL chuẩn hóa, chỉ dịch vụ Supabase được đọc/ghi.
BEGIN;
CREATE TABLE IF NOT EXISTS public.quote_product_cache (
  url_key text PRIMARY KEY CHECK (length(url_key) BETWEEN 1 AND 2400),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 300),
  image text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'official',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days')
);
ALTER TABLE public.quote_product_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quote_product_cache FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.quote_product_cache TO service_role;
INSERT INTO public.quote_product_cache(url_key,title,image,source,fetched_at,expires_at)
VALUES (
 'https://www.dienmayxanh.com/noi-com-dien/noi-com-dien-tu-bluestone-15-lit-rcb-5946?code=4844158000144',
 'Nồi cơm điện tử BlueStone 1.5 lít RCB-5946',
 'https://cdn.tgdd.vn/2026/11/timerseo/4844158000144-304519-clean-20261102-600x600.png',
 'verified-official-metadata',now(),now()+interval '30 days'
)
ON CONFLICT (url_key) DO UPDATE SET title=EXCLUDED.title,image=EXCLUDED.image,
 source=EXCLUDED.source,fetched_at=EXCLUDED.fetched_at,expires_at=EXCLUDED.expires_at;
COMMIT;