-- Permisos globales RLS para operaciones sin inicio de sesión en ambiente abierto
grant usage on schema public to anon;
grant select, insert, update, delete on public.profiles, public.projects, public.vehicles, public.journeys, public.journey_stops, public.odometer_evidence, public.integration_settings, public.sync_runs, public.import_batches to anon;

do $$ begin create policy open_anon_profiles on public.profiles for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy open_anon_projects on public.projects for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy open_anon_vehicles on public.vehicles for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy open_anon_journeys on public.journeys for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy open_anon_stops on public.journey_stops for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy open_anon_evidence on public.odometer_evidence for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy open_anon_imports on public.import_batches for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;

do $$ begin create policy open_auth_journeys on public.journeys for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy open_auth_stops on public.journey_stops for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy open_auth_vehicles on public.vehicles for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy open_auth_projects on public.projects for all to authenticated using (true) with check (true); exception when duplicate_object then null; end $$;
