-- Add inventory 4.0 ownership cleanup so Admin may delete an account from any SHOP.
-- Inventory history persists: inventory session creator is reassigned to Super Admin,
-- while scanner attribution becomes NULL; no products/counts are lost.
BEGIN;
CREATE OR REPLACE FUNCTION public.staff_delete_cleanup(p_target uuid,p_actor uuid,p_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE
 v_preview jsonb;v_admin uuid;v_n int;v_m int;v_nt int;
 v_t int;v_rt int;v_inventory int;v_scans int;
BEGIN
 PERFORM 1 FROM public.profiles WHERE id=p_target FOR UPDATE;
 v_preview:=public.staff_delete_preview(p_target,p_actor,p_code);
 IF coalesce((v_preview->>'photos')::int,0)>0 THEN
  RAISE EXCEPTION 'Photo objects must be removed via Storage API first';
 END IF;
 SELECT a.id INTO v_admin FROM public.profiles a
 WHERE a.is_admin=true AND a.employee_code='112191' AND a.active=true;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'Admin 112191 is missing';END IF;

 UPDATE public.tasks SET created_by=v_admin WHERE created_by=p_target;
 GET DIAGNOSTICS v_t=ROW_COUNT;
 UPDATE public.recurring_templates SET created_by=v_admin WHERE created_by=p_target;
 GET DIAGNOSTICS v_rt=ROW_COUNT;
 UPDATE public.inventory_sessions SET created_by=v_admin WHERE created_by=p_target;
 GET DIAGNOSTICS v_inventory=ROW_COUNT;
 UPDATE public.inventory_counts SET updated_by=NULL WHERE updated_by=p_target;
 GET DIAGNOSTICS v_scans=ROW_COUNT;

 DELETE FROM public.assignments WHERE staff_id=p_target;
 GET DIAGNOSTICS v_n=ROW_COUNT;
 DELETE FROM public.recurring_members WHERE staff_id=p_target;
 GET DIAGNOSTICS v_m=ROW_COUNT;
 DELETE FROM public.notifications WHERE recipient_id=p_target;
 GET DIAGNOSTICS v_nt=ROW_COUNT;
 RETURN jsonb_build_object('assignments_removed',v_n,'recurring_members_removed',v_m,
 'recipient_notifications_removed',v_nt,'tasks_reassigned',v_t,'templates_reassigned',v_rt,
 'inventory_sessions_reassigned',v_inventory,'scans_unattributed',v_scans);
END
$function$;
REVOKE ALL ON FUNCTION public.staff_delete_cleanup(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_cleanup(uuid,uuid,text) TO service_role;
COMMIT;