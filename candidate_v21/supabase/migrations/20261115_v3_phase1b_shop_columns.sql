-- 112191 WORK v3.0 / phase 1b. Applied to current Supabase project 2026-11-15.
-- Additive, non-destructive tenant columns and cross-shop consistency triggers.
-- Existing v2 clients that omit shop_id still default tasks/templates to SHOP 102.
BEGIN;
CREATE OR REPLACE FUNCTION public.work_default_shop_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT id FROM public.work_shops WHERE shop_code='102' LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.work_default_shop_id() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.work_default_shop_id() TO authenticated,service_role;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.work_shops(id);
ALTER TABLE public.recurring_templates ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.work_shops(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.work_shops(id);
UPDATE public.tasks SET shop_id=public.work_default_shop_id() WHERE shop_id IS NULL;
UPDATE public.recurring_templates SET shop_id=public.work_default_shop_id() WHERE shop_id IS NULL;
UPDATE public.notifications n SET shop_id=t.shop_id FROM public.tasks t
WHERE n.task_id=t.id AND n.shop_id IS DISTINCT FROM t.shop_id;
ALTER TABLE public.tasks ALTER COLUMN shop_id SET DEFAULT public.work_default_shop_id();
ALTER TABLE public.recurring_templates ALTER COLUMN shop_id SET DEFAULT public.work_default_shop_id();
ALTER TABLE public.tasks ALTER COLUMN shop_id SET NOT NULL;
ALTER TABLE public.recurring_templates ALTER COLUMN shop_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS work_tasks_shop_due ON public.tasks(shop_id,due_at DESC);
CREATE INDEX IF NOT EXISTS work_recurring_shop_created ON public.recurring_templates(shop_id,created_at DESC);
CREATE INDEX IF NOT EXISTS work_notifications_shop_recipient_created ON public.notifications(shop_id,recipient_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.work_enforce_task_shop()
RETURNS trigger LANGUAGE plpgsql SET search_path=''
AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.shop_id IS DISTINCT FROM OLD.shop_id
 THEN RAISE EXCEPTION 'Cannot move an existing task or recurring template between shops';END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS work_tasks_immutable_shop ON public.tasks;
CREATE TRIGGER work_tasks_immutable_shop BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.work_enforce_task_shop();
DROP TRIGGER IF EXISTS work_templates_immutable_shop ON public.recurring_templates;
CREATE TRIGGER work_templates_immutable_shop BEFORE UPDATE ON public.recurring_templates
FOR EACH ROW EXECUTE FUNCTION public.work_enforce_task_shop();

CREATE OR REPLACE FUNCTION public.work_notifications_assign_shop()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_shop uuid;
BEGIN
 IF NEW.task_id IS NOT NULL THEN
  SELECT shop_id INTO v_shop FROM public.tasks WHERE id=NEW.task_id;
  IF v_shop IS NULL THEN RAISE EXCEPTION 'Task shop is missing';END IF;
  IF NEW.shop_id IS NOT NULL AND NEW.shop_id<>v_shop
  THEN RAISE EXCEPTION 'Notification shop mismatch';END IF;
  NEW.shop_id:=v_shop;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS work_notifications_set_shop ON public.notifications;
CREATE TRIGGER work_notifications_set_shop BEFORE INSERT OR UPDATE OF task_id,shop_id
ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.work_notifications_assign_shop();

ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.work_shops(id);
UPDATE public.assignments a SET shop_id=t.shop_id FROM public.tasks t
WHERE a.task_id=t.id AND a.shop_id IS DISTINCT FROM t.shop_id;
ALTER TABLE public.assignments ALTER COLUMN shop_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS work_assignments_shop_staff_status ON public.assignments(shop_id,staff_id,status,created_at DESC);

CREATE OR REPLACE FUNCTION public.work_assignment_set_shop()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_shop uuid;
BEGIN
 SELECT t.shop_id INTO v_shop FROM public.tasks t WHERE t.id=NEW.task_id;
 IF v_shop IS NULL THEN RAISE EXCEPTION 'Assignment task or shop not found';END IF;
 IF NEW.shop_id IS NOT NULL AND NEW.shop_id IS DISTINCT FROM v_shop
 THEN RAISE EXCEPTION 'Assignment shop differs from task shop';END IF;
 NEW.shop_id:=v_shop;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS work_assignments_set_shop ON public.assignments;
CREATE TRIGGER work_assignments_set_shop BEFORE INSERT OR UPDATE OF task_id,shop_id
ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.work_assignment_set_shop();

ALTER TABLE public.recurring_members ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.work_shops(id);
UPDATE public.recurring_members m SET shop_id=r.shop_id FROM public.recurring_templates r
WHERE m.template_id=r.id AND m.shop_id IS DISTINCT FROM r.shop_id;
ALTER TABLE public.recurring_members ALTER COLUMN shop_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS work_recurring_members_shop_user ON public.recurring_members(shop_id,staff_id);

CREATE OR REPLACE FUNCTION public.work_recurring_member_set_shop()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_shop uuid;
BEGIN
 SELECT r.shop_id INTO v_shop FROM public.recurring_templates r WHERE r.id=NEW.template_id;
 IF v_shop IS NULL THEN RAISE EXCEPTION 'Recurring template shop not found';END IF;
 IF NEW.shop_id IS NOT NULL AND NEW.shop_id IS DISTINCT FROM v_shop
 THEN RAISE EXCEPTION 'Recurring member shop mismatch';END IF;
 NEW.shop_id:=v_shop;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS work_recurring_members_set_shop ON public.recurring_members;
CREATE TRIGGER work_recurring_members_set_shop BEFORE INSERT OR UPDATE OF template_id,shop_id
ON public.recurring_members FOR EACH ROW EXECUTE FUNCTION public.work_recurring_member_set_shop();

REVOKE ALL ON FUNCTION public.work_enforce_task_shop() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.work_notifications_assign_shop() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.work_assignment_set_shop() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.work_recurring_member_set_shop() FROM PUBLIC,anon,authenticated;
COMMIT;
