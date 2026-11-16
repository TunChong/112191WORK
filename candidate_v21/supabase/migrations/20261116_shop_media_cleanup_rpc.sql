BEGIN;
CREATE OR REPLACE FUNCTION public.work_mark_deleted_shop_media(p_deletion uuid,p_paths text[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_count integer;
BEGIN
 UPDATE public.work_shop_deleted_media SET deleted=true,last_error=NULL,attempts=attempts+1
 WHERE deletion_id=p_deletion AND object_path=ANY(p_paths) AND deleted=false;
 GET DIAGNOSTICS v_count=ROW_COUNT;
 RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.work_mark_deleted_shop_media(uuid,text[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.work_mark_deleted_shop_media(uuid,text[]) TO service_role;
COMMIT;