-- READ ONLY: verifies production schema counts before migration.
select jsonb_build_object(
  'counts', jsonb_build_object(
    'profiles',(select count(*) from public.profiles),
    'tasks',(select count(*) from public.tasks),
    'assignments',(select count(*) from public.assignments),
    'recurring_templates',(select count(*) from public.recurring_templates),
    'recurring_members',(select count(*) from public.recurring_members),
    'notifications',(select count(*) from public.notifications),
    'storage_objects',(select count(*) from storage.objects where bucket_id='task-evidence')
  ),
  'category_constraints', coalesce((select jsonb_agg(jsonb_build_object('table', c.relname, 'name', con.conname, 'def', pg_get_constraintdef(con.oid))) from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('tasks','recurring_templates') and con.contype='c'), '[]'::jsonb),
  'profiles_policies', coalesce((select jsonb_agg(jsonb_build_object('policy',policyname,'command',cmd,'using',qual,'check',with_check)) from pg_policies where schemaname='public' and tablename='profiles'),'[]'::jsonb),
  'version', current_setting('server_version')
) as preflight;