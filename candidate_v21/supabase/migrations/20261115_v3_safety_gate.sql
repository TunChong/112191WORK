-- v3 multi-shop safety gate and audit. Applied to production 2026-11-15.
-- Gate defaults to FALSE; do not set TRUE until tenant-aware RLS, RPC and Edge Functions are verified.
BEGIN;
CREATE TABLE IF NOT EXISTS public.work_multi_shop_config (
 key text PRIMARY KEY CHECK (key='production'),
 isolation_ready boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.work_multi_shop_config(key,isolation_ready)
VALUES ('production',false) ON CONFLICT(key) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.work_shop_action_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 shop_id uuid REFERENCES public.work_shops(id) ON DELETE SET NULL,
 actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 target_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 action text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS work_shop_action_audit_by_shop
 ON public.work_shop_action_audit(shop_id,created_at DESC);
ALTER TABLE public.work_multi_shop_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shop_action_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.work_multi_shop_config,public.work_shop_action_audit
 FROM PUBLIC,anon,authenticated;
GRANT SELECT,UPDATE ON public.work_multi_shop_config TO service_role;
GRANT SELECT,INSERT ON public.work_shop_action_audit TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.work_shop_action_audit_id_seq TO service_role;
COMMIT;
