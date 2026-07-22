-- Metadatos de fotos para operar a escala: con dos fotos por viaje y muchos ingenieros subiendo
-- cada semana, se necesita poder auditar tamaño/tipo y detectar duplicados por huella (sha256).
alter table public.odometer_evidence
  add column if not exists byte_size integer check (byte_size is null or byte_size >= 0),
  add column if not exists mime_type text,
  add column if not exists width_px integer check (width_px is null or width_px > 0),
  add column if not exists height_px integer check (height_px is null or height_px > 0),
  add column if not exists sha256 text;

create index if not exists odometer_evidence_uploaded_at_idx on public.odometer_evidence(uploaded_at desc);
create index if not exists odometer_evidence_sha256_idx on public.odometer_evidence(sha256) where sha256 is not null;
