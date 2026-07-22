-- Las funciones son ejecutables por PUBLIC de forma predeterminada en PostgreSQL.
-- Limitar las funciones de autorizacion a usuarios autenticados y las funciones
-- de trigger exclusivamente a los triggers que las invocan.
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_journey_engineer(uuid) from public, anon;
revoke execute on function public.audit_row() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_journey_engineer(uuid) to authenticated;
