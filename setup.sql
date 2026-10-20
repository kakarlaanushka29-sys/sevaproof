-- Paste in Supabase > SQL Editor > Run
create table profiles(id uuid primary key, name text, role text);
create table events(id uuid primary key default gen_random_uuid(), name text, lat double precision, lng double precision, owner uuid, created timestamptz default now());
create table checkins(id text primary key, event_id uuid, event_name text, uid uuid, name text, in_time bigint, out_time bigint, hours numeric default 0);
