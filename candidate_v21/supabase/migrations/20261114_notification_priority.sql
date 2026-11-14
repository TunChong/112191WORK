-- v2.4: Keep the existing notification center as fallback when phone push
-- permission is not granted. New task notices explicitly show priority.
CREATE OR REPLACE FUNCTION public.notify_work_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE t public.tasks; level_text text; due_text text;
BEGIN
 SELECT * INTO t FROM public.tasks WHERE id=NEW.task_id;
 level_text:=CASE WHEN t.priority='high' THEN 'ƯU TIÊN CAO' ELSE 'BÌNH THƯỜNG' END;
 due_text:=to_char(t.due_at AT TIME ZONE 'Asia/Ho_Chi_Minh','DD/MM HH24:MI');
 INSERT INTO public.notifications(recipient_id,title,body,task_id,assignment_id,event_key)
 VALUES(NEW.staff_id,'Công việc mới · '||level_text,t.title||' · Hạn: '||due_text,t.id,NEW.id,'new:'||NEW.id::text)
 ON CONFLICT(recipient_id,event_key) DO NOTHING;
 RETURN NEW;
END;
$$;
