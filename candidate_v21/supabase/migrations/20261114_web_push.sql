-- 112191 WORK Web Push. All endpoint keys and private VAPID keys are server-only.
-- No public client can list subscriptions or the VAPID private key.
BEGIN;

CREATE TABLE IF NOT EXISTS app_private.work_vapid_keys(
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 keys jsonb NOT NULL,
 public_key text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON app_private.work_vapid_keys FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA app_private TO service_role;
GRANT SELECT, INSERT ON app_private.work_vapid_keys TO service_role;

CREATE TABLE IF NOT EXISTS public.work_push_subscriptions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 endpoint text NOT NULL UNIQUE CHECK (length(endpoint) BETWEEN 50 AND 2048),
 p256dh text NOT NULL CHECK (length(p256dh) BETWEEN 40 AND 256),
 auth_secret text NOT NULL CHECK (length(auth_secret) BETWEEN 12 AND 256),
 user_agent text,
 registered_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS work_push_subscriptions_user_idx
 ON public.work_push_subscriptions(user_id);
ALTER TABLE public.work_push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.work_push_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_push_subscriptions TO service_role;

CREATE TABLE IF NOT EXISTS public.work_push_deliveries(
 assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
 subscription_id uuid NOT NULL REFERENCES public.work_push_subscriptions(id) ON DELETE CASCADE,
 state text NOT NULL CHECK (state IN ('sending','sent','failed')),
 attempts integer NOT NULL DEFAULT 1,
 last_attempt_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz,
 last_error text,
 PRIMARY KEY (assignment_id,subscription_id)
);
ALTER TABLE public.work_push_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.work_push_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_push_deliveries TO service_role;

CREATE OR REPLACE FUNCTION public.work_push_get_keys()
RETURNS TABLE(keys jsonb,public_key text)
LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $$ SELECT v.keys,v.public_key FROM app_private.work_vapid_keys v WHERE id=true $$;
REVOKE ALL ON FUNCTION public.work_push_get_keys() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.work_push_get_keys() TO service_role;

CREATE OR REPLACE FUNCTION public.work_push_set_keys(p_keys jsonb,p_public_key text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF jsonb_typeof(p_keys) <> 'object'
    OR NOT p_keys ? 'publicKey' OR NOT p_keys ? 'privateKey'
    OR length(p_public_key) NOT BETWEEN 80 AND 130 THEN
    RAISE EXCEPTION 'Invalid VAPID material';
 END IF;
 INSERT INTO app_private.work_vapid_keys(id,keys,public_key)
 VALUES(true,p_keys,p_public_key) ON CONFLICT(id) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.work_push_set_keys(jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.work_push_set_keys(jsonb,text) TO service_role;

CREATE OR REPLACE FUNCTION public.work_push_claim_delivery(
 p_assignment uuid,p_subscription uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_claim uuid;
BEGIN
 INSERT INTO public.work_push_deliveries(assignment_id,subscription_id,state)
 VALUES(p_assignment,p_subscription,'sending')
 ON CONFLICT(assignment_id,subscription_id) DO UPDATE
 SET state='sending',
     attempts=public.work_push_deliveries.attempts+1,
     last_attempt_at=now(),
     last_error=null
 WHERE public.work_push_deliveries.state <> 'sent'
   AND public.work_push_deliveries.last_attempt_at < now()-interval '60 seconds'
 RETURNING assignment_id INTO v_claim;
 RETURN v_claim IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.work_push_claim_delivery(uuid,uuid)
 FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.work_push_claim_delivery(uuid,uuid)
 TO service_role;

COMMIT;