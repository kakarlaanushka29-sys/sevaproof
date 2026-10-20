-- setup_checkin_security.sql (SevaProof)
-- Run in Supabase > SQL Editor AFTER setup.sql.
-- Server-side rules so duplicates and proxy attempts are blocked even if someone bypasses the browser.
-- NOTE: event_id and member_id types below are uuid. If setup.sql uses other types (int/text), change them to match.

create table if not exists checkin_log (
  id          uuid primary key,                         -- made on the phone (offline.js), so retries never duplicate
  event_id    uuid not null,
  member_id   uuid not null references auth.users(id),
  kind        text not null check (kind in ('in','out')),
  device_id   text not null,
  client_time timestamptz not null,                     -- time of the scan on the phone
  lat         double precision,
  lng         double precision,
  created_at  timestamptz not null default now(),

  -- one check-in and one check-out per volunteer per event
  constraint one_per_member unique (event_id, member_id, kind),
  -- one phone cannot check in two different volunteers to the same event
  constraint one_per_device unique (event_id, device_id, kind)
);

alter table checkin_log enable row level security;

-- a volunteer can add and read only their own rows
create policy "own insert" on checkin_log for insert with check (auth.uid() = member_id);
create policy "own read"   on checkin_log for select using (auth.uid() = member_id);

-- hours per volunteer per event (check-out minus check-in, max 24 h)
create or replace view service_hours as
select i.member_id,
       i.event_id,
       round(least(extract(epoch from (o.client_time - i.client_time)) / 3600.0, 24)::numeric, 2) as hours
from checkin_log i
join checkin_log o on o.event_id = i.event_id and o.member_id = i.member_id and o.kind = 'out'
where i.kind = 'in' and o.client_time > i.client_time;