-- Run once in Supabase > SQL Editor
alter table profiles add column if not exists type text, add column if not exists org text, add column if not exists emp_id text,
 add column if not exists phone text, add column if not exists city text, add column if not exists bio text,
 add column if not exists member_code text, add column if not exists member_year int;
