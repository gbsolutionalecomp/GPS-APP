-- Bootstrap del esquema GPS para proyectos donde el historial remoto no trajo
-- las tablas base, pero sí existen versiones anteriores en Supabase.
create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin', 'engineer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.journey_source as enum ('planned', 'locatelia_api', 'locatelia_webhook', 'locatelia_import');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.integration_mode as enum ('disabled', 'api', 'webhook', 'import');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.sync_status as enum ('success', 'warning', 'error', 'running');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.evidence_kind as enum ('before', 'after');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  email text not null unique,
  role public.user_role not null default 'engineer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists role public.user_role not null default 'engineer',
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects
  add column if not exists code text,
  add column if not exists name text,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null unique,
  name text not null,
  locatelia_device_id text unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vehicles
  add column if not exists plate text,
  add column if not exists name text,
  add column if not exists locatelia_device_id text,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  fingerprint text unique,
  source public.journey_source not null,
  vehicle_id uuid not null references public.vehicles(id),
  project_id uuid references public.projects(id),
  engineer_id uuid references public.profiles(id),
  planned_start timestamptz,
  planned_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  origin text,
  destination text,
  gps_distance_km numeric(12,1) check (gps_distance_km is null or gps_distance_km >= 0),
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planned_window_valid check (planned_end is null or planned_start is null or planned_end > planned_start),
  constraint actual_window_valid check (actual_end is null or actual_start is null or actual_end >= actual_start),
  constraint external_reference_present check (external_id is not null or fingerprint is not null or source = 'planned')
);
alter table public.journeys
  add column if not exists external_id text,
  add column if not exists fingerprint text,
  add column if not exists source public.journey_source,
  add column if not exists vehicle_id uuid,
  add column if not exists project_id uuid,
  add column if not exists engineer_id uuid,
  add column if not exists planned_start timestamptz,
  add column if not exists planned_end timestamptz,
  add column if not exists actual_start timestamptz,
  add column if not exists actual_end timestamptz,
  add column if not exists origin text,
  add column if not exists destination text,
  add column if not exists gps_distance_km numeric(12,1),
  add column if not exists source_updated_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.journey_stops (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id),
  sequence integer not null check (sequence > 0),
  arrived_at timestamptz not null,
  departed_at timestamptz,
  location text not null,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(journey_id, sequence),
  check (departed_at is null or departed_at >= arrived_at)
);
alter table public.journey_stops
  add column if not exists journey_id uuid,
  add column if not exists sequence integer,
  add column if not exists arrived_at timestamptz,
  add column if not exists departed_at timestamptz,
  add column if not exists location text,
  add column if not exists duration_minutes integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.odometer_evidence (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id),
  kind public.evidence_kind not null,
  reading_km numeric(12,1) not null check (reading_km >= 0),
  storage_path text not null unique,
  uploaded_by uuid not null references public.profiles(id),
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(journey_id, kind),
  check (storage_path like journey_id::text || '/%')
);
alter table public.odometer_evidence
  add column if not exists journey_id uuid,
  add column if not exists kind public.evidence_kind,
  add column if not exists reading_km numeric(12,1),
  add column if not exists storage_path text,
  add column if not exists uploaded_by uuid,
  add column if not exists uploaded_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.integration_settings (
  provider text primary key default 'locatelia' check (provider = 'locatelia'),
  mode public.integration_mode not null default 'disabled',
  poll_interval_minutes integer not null default 1 check (poll_interval_minutes >= 1),
  last_synced_at timestamptz,
  last_successful_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
alter table public.integration_settings
  add column if not exists provider text,
  add column if not exists mode public.integration_mode not null default 'disabled',
  add column if not exists poll_interval_minutes integer not null default 1,
  add column if not exists last_synced_at timestamptz,
  add column if not exists last_successful_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid;

insert into public.integration_settings(provider) values ('locatelia') on conflict do nothing;

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source public.journey_source not null,
  status public.sync_status not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  received integer not null default 0 check (received >= 0),
  inserted integer not null default 0 check (inserted >= 0),
  updated integer not null default 0 check (updated >= 0),
  error_message text,
  created_at timestamptz not null default now()
);
alter table public.sync_runs
  add column if not exists source public.journey_source,
  add column if not exists status public.sync_status not null default 'running',
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists finished_at timestamptz,
  add column if not exists received integer not null default 0,
  add column if not exists inserted integer not null default 0,
  add column if not exists updated integer not null default 0,
  add column if not exists error_message text,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'locatelia',
  file_name text not null,
  row_count integer not null check (row_count >= 0),
  accepted_count integer not null check (accepted_count >= 0),
  rejected_count integer not null check (rejected_count >= 0),
  imported_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.import_batches
  add column if not exists provider text,
  add column if not exists file_name text,
  add column if not exists row_count integer not null default 0,
  add column if not exists accepted_count integer not null default 0,
  add column if not exists rejected_count integer not null default 0,
  add column if not exists imported_by uuid,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
alter table public.audit_log
  add column if not exists table_name text,
  add column if not exists record_id text,
  add column if not exists action text,
  add column if not exists old_data jsonb,
  add column if not exists new_data jsonb,
  add column if not exists actor_id uuid,
  add column if not exists created_at timestamptz not null default now();

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and active); $$;
create or replace function public.is_journey_engineer(target_journey_id uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.journeys where id = target_journey_id and engineer_id = auth.uid()); $$;
create or replace function public.audit_row() returns trigger language plpgsql security definer set search_path = public as $$
declare identifier text;
begin
  identifier := coalesce(new.id, old.id)::text;
  insert into public.audit_log(table_name, record_id, action, old_data, new_data, actor_id)
  values (tg_table_name, identifier, tg_op, case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end, case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end, auth.uid());
  return coalesce(new, old);
end; $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), new.email, 'engineer')
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name;
  return new;
end; $$;

do $$ begin create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger vehicles_updated before update on public.vehicles for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger journeys_updated before update on public.journeys for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger stops_updated before update on public.journey_stops for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger evidence_updated before update on public.odometer_evidence for each row execute function public.set_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger profile_from_auth after insert on auth.users for each row execute function public.handle_new_user(); exception when duplicate_object then null; end $$;
do $$ begin create trigger audit_projects after insert or update or delete on public.projects for each row execute function public.audit_row(); exception when duplicate_object then null; end $$;
do $$ begin create trigger audit_vehicles after insert or update or delete on public.vehicles for each row execute function public.audit_row(); exception when duplicate_object then null; end $$;
do $$ begin create trigger audit_journeys after insert or update or delete on public.journeys for each row execute function public.audit_row(); exception when duplicate_object then null; end $$;
do $$ begin create trigger audit_stops after insert or update or delete on public.journey_stops for each row execute function public.audit_row(); exception when duplicate_object then null; end $$;
do $$ begin create trigger audit_evidence after insert or update or delete on public.odometer_evidence for each row execute function public.audit_row(); exception when duplicate_object then null; end $$;
do $$ begin create trigger audit_imports after insert or update or delete on public.import_batches for each row execute function public.audit_row(); exception when duplicate_object then null; end $$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.vehicles enable row level security;
alter table public.journeys enable row level security;
alter table public.journey_stops enable row level security;
alter table public.odometer_evidence enable row level security;
alter table public.integration_settings enable row level security;
alter table public.sync_runs enable row level security;
alter table public.import_batches enable row level security;
alter table public.audit_log enable row level security;

do $$ begin create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy profiles_admin_write on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy projects_read on public.projects for select to authenticated using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy projects_admin_write on public.projects for all to authenticated using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy vehicles_read on public.vehicles for select to authenticated using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy vehicles_admin_write on public.vehicles for all to authenticated using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy journeys_read on public.journeys for select to authenticated using (public.is_admin() or engineer_id = auth.uid()); exception when duplicate_object then null; end $$;
do $$ begin create policy journeys_admin_write on public.journeys for all to authenticated using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy stops_read on public.journey_stops for select to authenticated using (public.is_admin() or public.is_journey_engineer(journey_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy stops_admin_write on public.journey_stops for all to authenticated using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy evidence_read on public.odometer_evidence for select to authenticated using (public.is_admin() or public.is_journey_engineer(journey_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy evidence_insert on public.odometer_evidence for insert to authenticated with check (public.is_admin() or (uploaded_by = auth.uid() and public.is_journey_engineer(journey_id))); exception when duplicate_object then null; end $$;
do $$ begin create policy evidence_update on public.odometer_evidence for update to authenticated using (public.is_admin() or uploaded_by = auth.uid()) with check (public.is_admin() or (uploaded_by = auth.uid() and public.is_journey_engineer(journey_id))); exception when duplicate_object then null; end $$;
do $$ begin create policy settings_admin on public.integration_settings for all to authenticated using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy sync_admin on public.sync_runs for select to authenticated using (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy imports_admin on public.import_batches for all to authenticated using (public.is_admin()) with check (public.is_admin()); exception when duplicate_object then null; end $$;
do $$ begin create policy audit_admin on public.audit_log for select to authenticated using (public.is_admin()); exception when duplicate_object then null; end $$;

grant usage on schema public to authenticated;
grant select on public.profiles, public.projects, public.vehicles, public.journeys, public.journey_stops, public.odometer_evidence, public.integration_settings, public.sync_runs, public.import_batches, public.audit_log to authenticated;
grant insert, update on public.projects, public.vehicles, public.journeys, public.journey_stops, public.odometer_evidence, public.integration_settings, public.import_batches to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.is_admin(), public.is_journey_engineer(uuid) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('odometer-evidence', 'odometer-evidence', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
do $$ begin create policy odometer_storage_read on storage.objects for select to authenticated using (bucket_id = 'odometer-evidence' and (public.is_admin() or public.is_journey_engineer((storage.foldername(name))[1]::uuid))); exception when duplicate_object then null; end $$;
do $$ begin create policy odometer_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'odometer-evidence' and (public.is_admin() or public.is_journey_engineer((storage.foldername(name))[1]::uuid))); exception when duplicate_object then null; end $$;
do $$ begin create policy odometer_storage_update on storage.objects for update to authenticated using (bucket_id = 'odometer-evidence' and (public.is_admin() or owner_id::text = auth.uid()::text)) with check (bucket_id = 'odometer-evidence' and (public.is_admin() or public.is_journey_engineer((storage.foldername(name))[1]::uuid))); exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.journeys, public.journey_stops, public.odometer_evidence;
exception when duplicate_object then null; end $$;
