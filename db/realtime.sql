-- Supabase Realtime: шалгалтад өөрчлөлт гарахад багшийн самбарт дохио илгээнэ.
-- Дохионд өгөгдөл агуулагдахгүй (зөвхөн цаг); самбар өөрөө серверээс шинээр татна.
-- Зөвхөн Supabase дээр ажиллана (realtime.send функц шаардлагатай).

create or replace function public.notify_exam_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exam uuid;
begin
  if tg_table_name = 'attempts' then
    v_exam := coalesce(new.exam_id, old.exam_id);
  else
    select a.exam_id into v_exam from public.attempts a where a.id = coalesce(new.attempt_id, old.attempt_id);
  end if;
  if v_exam is not null then
    perform realtime.send(jsonb_build_object('at', now()), 'changed', 'exam:' || v_exam::text, false);
    perform realtime.send(jsonb_build_object('at', now()), 'changed', 'exams', false);
  end if;
  return null;
end;
$$;

revoke execute on function public.notify_exam_change() from public, anon, authenticated;

-- Сурагч орох, хэсэг илгээх, багш хугацаа сунгах гэх мэт.
drop trigger if exists attempts_realtime on public.attempts;
create trigger attempts_realtime
  after insert or update or delete on public.attempts
  for each row execute function public.notify_exam_change();

-- Оноо өөрчлөгдөхөд (автомат шалгалт, багшийн үнэлгээ). Автомат хадгалалт
-- item_scores-ийг өөрчилдөггүй тул энд дохио үүсгэхгүй.
drop trigger if exists answers_realtime on public.answers;
create trigger answers_realtime
  after update of item_scores on public.answers
  for each row execute function public.notify_exam_change();
