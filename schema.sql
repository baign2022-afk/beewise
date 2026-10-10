-- Run once in Supabase SQL editor. Create your user in Authentication first.
create extension if not exists pgcrypto with schema extensions;
create table public.hives(id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), name text not null, location text);
create table public.devices(id uuid primary key default gen_random_uuid(), hive_id uuid not null references public.hives(id), key_hash text not null, enabled boolean not null default true);
create table public.readings(reading_id uuid primary key, device_id uuid not null references public.devices(id), hive_id uuid not null references public.hives(id), measured_at timestamptz not null, received_at timestamptz not null default now(), temperature_c double precision not null check(temperature_c between -60 and 100), humidity_pct double precision not null check(humidity_pct between 0 and 100), co2_ppm double precision not null check(co2_ppm between 0 and 100000), battery_v double precision check(battery_v between 0 and 60));
create index on public.readings(hive_id, measured_at desc);
create table public.inspections(id uuid primary key default gen_random_uuid(), hive_id uuid not null references public.hives(id), inspected_on date not null, activity text not null, observations text not null check(length(observations)<=2000));
alter table public.hives enable row level security;
alter table public.devices enable row level security;
alter table public.readings enable row level security;
alter table public.inspections enable row level security;
create policy "Owner reads hives" on public.hives for select to authenticated using(owner_id=auth.uid());
create policy "Owner reads measurements" on public.readings for select to authenticated using(exists(select 1 from public.hives h where h.id=hive_id and h.owner_id=auth.uid()));
create policy "Owner reads inspections" on public.inspections for select to authenticated using(exists(select 1 from public.hives h where h.id=hive_id and h.owner_id=auth.uid()));
create policy "Owner adds inspections" on public.inspections for insert to authenticated with check(exists(select 1 from public.hives h where h.id=hive_id and h.owner_id=auth.uid()));
revoke all on public.devices from anon, authenticated;
revoke all on public.readings, public.hives, public.inspections from anon;
grant select on public.hives, public.readings, public.inspections to authenticated;
grant insert on public.inspections to authenticated;
-- Replace USER_UUID with Authentication user's ID:
-- insert into public.hives(owner_id,name,location) values('USER_UUID','My first hive','My apiary') returning id;
-- Generate a long random DEVICE_SECRET, retain it on Arduino, and replace HIVE_UUID:
-- insert into public.devices(hive_id,key_hash) values('HIVE_UUID',encode(extensions.digest('DEVICE_SECRET','sha256'),'hex')) returning id;
