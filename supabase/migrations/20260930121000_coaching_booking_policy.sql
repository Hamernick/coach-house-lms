create or replace function public.manage_coaching_credit_booking(
  p_booking_id uuid,p_actor_id uuid,p_action text,p_staff boolean,p_reason text,
  p_starts_at timestamptz default null,p_timezone text default null,p_request_id uuid default null,
  p_expected_starts_at timestamptz default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare b coaching_bookings; v_restored boolean:=false; v_early boolean; v_revision integer; v_reason text; v_key text; v_entry uuid;
begin
  select * into strict b from coaching_bookings where id=p_booking_id for update;
  perform pg_advisory_xact_lock(hashtextextended('coaching-joint-calendar',0));
  if not p_staff and p_actor_id is distinct from b.user_id then raise exception 'Booking not found'; end if;
  if p_action not in ('cancel','calendar_cancel','reschedule','completed','no_show') then raise exception 'Invalid booking action'; end if;
  if p_action in ('calendar_cancel','completed','no_show') and not p_staff then raise exception 'Staff access required'; end if;
  v_key:='manage:'||b.id||':'||coalesce(p_request_id::text,p_action);
  if exists(select 1 from coaching_credit_ledger where operation_key=v_key) then
    return jsonb_build_object('success',true,'creditRestored',exists(select 1 from coaching_credit_ledger where booking_id=b.id and source='cancellation'));
  end if;
  if b.status='canceled' and p_action in ('cancel','calendar_cancel') then
    return jsonb_build_object('success',true,'creditRestored',exists(select 1 from coaching_credit_ledger where booking_id=b.id and source='cancellation'));
  end if;
  if b.status<>'confirmed' then raise exception 'Only confirmed meetings can be changed'; end if;
  if p_expected_starts_at is not null and b.starts_at<>p_expected_starts_at then raise exception 'Meeting changed. Refresh and try again.'; end if;
  if not p_staff and b.starts_at<=now() then raise exception 'Past meetings cannot be changed here'; end if;
  if p_action in ('completed','no_show') and b.starts_at>now() then raise exception 'The meeting has not started yet'; end if;
  v_early:=b.starts_at-now()>=interval '4 hours';
  v_reason:=coalesce(nullif(btrim(p_reason),''),case p_action when 'calendar_cancel' then 'Coach canceled the Google Calendar event.' when 'cancel' then 'Meeting canceled.' when 'reschedule' then 'Meeting rescheduled.' when 'no_show' then 'Participant did not attend.' else 'Meeting completed.' end);
  if length(v_reason)>1000 then raise exception 'Keep reason under 1000 characters'; end if;
  if p_action in ('cancel','calendar_cancel') then
    if p_staff or v_early then
      v_restored:=restore_coaching_credit(b.id,p_actor_id,v_reason);
    end if;
    update coaching_bookings set status='canceled',canceled_at=now(),cancel_reason=v_reason,
      calendar_pending_action=case when p_action='calendar_cancel' then null else 'delete' end where id=b.id;
    insert into coaching_credit_ledger(user_id,org_id,booking_id,actor_id,source,quantity,note,operation_key)
      values(b.user_id,b.org_id,b.id,p_actor_id,case when p_staff or v_early then 'canceled' else 'late_cancellation' end,0,
        v_reason||case when p_staff or v_early then ' Eligible reservation restored to its original grant.' else ' Less than 4 hours notice; credit forfeited.' end,v_key);
  elsif p_action='reschedule' then
    if b.calendar_pending_action='create' then raise exception 'Calendar confirmation is pending. Please try again shortly.'; end if;
    if p_starts_at is null or p_starts_at<=now() or p_request_id is null then raise exception 'Choose a future time'; end if;
    -- One booking, one current reservation. Old late-reschedule charges remain in history.
    v_revision:=b.credit_revision+1;
    v_entry:=b.current_credit_entry_id;
    if not p_staff and not v_early then
      v_entry:=consume_coaching_credit(b.id,p_actor_id,'book:'||b.id||':'||v_revision);
    end if;
    perform pg_advisory_xact_lock(hashtextextended('coaching-joint-calendar',0));
    if exists(select 1 from coaching_bookings where id<>b.id and status='confirmed'
      and starts_at<p_starts_at+interval '45 minutes' and ends_at>p_starts_at) then raise exception 'That slot was just taken'; end if;
    update coaching_bookings set starts_at=p_starts_at,ends_at=p_starts_at+interval '45 minutes',
      timezone=coalesce(nullif(p_timezone,''),timezone),credit_revision=v_revision,current_credit_entry_id=v_entry,calendar_pending_action='update' where id=b.id;
    insert into coaching_credit_ledger(user_id,org_id,booking_id,actor_id,source,quantity,note,operation_key)
      values(b.user_id,b.org_id,b.id,p_actor_id,'reschedule',0,v_reason||' Previous time: '||b.starts_at::text||'. New time: '||p_starts_at::text||
        case when p_staff or v_early then '. Existing credit transferred.' else '. Late reschedule: previous credit forfeited; another credit reserved.' end,v_key);
  else
    update coaching_bookings set status=p_action where id=b.id;
    insert into coaching_credit_ledger(user_id,org_id,booking_id,actor_id,source,quantity,note,operation_key)
      values(b.user_id,b.org_id,b.id,p_actor_id,p_action,0,v_reason||' Credit remains used.',v_key);
  end if;
  return jsonb_build_object('success',true,'creditRestored',v_restored);
end; $$;
revoke all on function public.manage_coaching_credit_booking(uuid,uuid,text,boolean,text,timestamptz,text,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.manage_coaching_credit_booking(uuid,uuid,text,boolean,text,timestamptz,text,uuid,timestamptz) to service_role;
