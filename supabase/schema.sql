-- =============================================================================
-- FIXHUB - SUPABASE DATABASE SCHEMA
-- Run this whole file once in Supabase: Dashboard > SQL Editor > New query.
-- It is safe to run again: tables use IF NOT EXISTS and policies are recreated.
--
-- Security model (Row Level Security):
--   * Visitors (role "anon") can READ active services and SEND contact messages.
--   * Admins (users listed in public.admins) can manage services and messages.
--   * Nobody can write to public.admins through the API; admins are added here,
--     in the SQL editor, so the website never needs a public "register" page.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. TABLES
-- -----------------------------------------------------------------------------

-- Catalog of services offered by FixHub. Every text exists in English and Spanish
-- because the website is bilingual.
create table if not exists public.services (
    id               bigint generated always as identity primary key,
    name_en          text not null check (char_length(name_en) between 2 and 80),
    name_es          text not null check (char_length(name_es) between 2 and 80),
    description_en   text not null check (char_length(description_en) between 10 and 400),
    description_es   text not null check (char_length(description_es) between 10 and 400),
    category         text not null check (category in ('repair', 'maintenance', 'upgrade', 'support')),
    price            numeric(10, 2) not null check (price >= 0),
    duration_minutes integer not null check (duration_minutes between 5 and 1440),
    is_active        boolean not null default true,
    sort_order       integer not null default 0,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

-- Messages sent from the public contact form. The CHECK constraints are the
-- server-side validation: even if someone skips the JavaScript validation and
-- calls the API directly, invalid data is rejected by the database.
create table if not exists public.contact_messages (
    id         bigint generated always as identity primary key,
    name       text not null check (char_length(name) between 2 and 80),
    email      text not null check (char_length(email) <= 120 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    phone      text check (phone is null or char_length(phone) <= 30),
    service_id bigint references public.services (id) on delete set null,
    message    text not null check (char_length(message) between 10 and 2000),
    status     text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
    created_at timestamptz not null default now()
);

-- Users allowed to open the admin panel. Rows point to accounts created in
-- Supabase Authentication.
create table if not exists public.admins (
    user_id    uuid primary key references auth.users (id) on delete cascade,
    created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists services_sort_idx on public.services (sort_order, id);


-- -----------------------------------------------------------------------------
-- 2. HELPERS
-- -----------------------------------------------------------------------------

-- Returns true when the user making the request is an admin.
-- SECURITY DEFINER lets it read public.admins even though the API cannot.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Keeps services.updated_at current on every edit.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists services_touch_updated_at on public.services;
create trigger services_touch_updated_at
    before update on public.services
    for each row execute function public.touch_updated_at();


-- -----------------------------------------------------------------------------
-- 3. PERMISSIONS + ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

alter table public.services         enable row level security;
alter table public.contact_messages enable row level security;
alter table public.admins           enable row level security;

-- Table-level grants (RLS policies below decide which ROWS each role can touch).
grant select                         on public.services         to anon, authenticated;
grant insert, update, delete         on public.services         to authenticated;
grant insert                         on public.contact_messages to anon, authenticated;
grant select, update, delete         on public.contact_messages to authenticated;
revoke all                           on public.admins           from anon, authenticated;

-- SERVICES
drop policy if exists "Read active services" on public.services;
create policy "Read active services" on public.services
    for select to anon, authenticated
    using (is_active or public.is_admin());

drop policy if exists "Admins insert services" on public.services;
create policy "Admins insert services" on public.services
    for insert to authenticated
    with check (public.is_admin());

drop policy if exists "Admins update services" on public.services;
create policy "Admins update services" on public.services
    for update to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "Admins delete services" on public.services;
create policy "Admins delete services" on public.services
    for delete to authenticated
    using (public.is_admin());

-- CONTACT MESSAGES
-- Visitors can only create new messages; they can never read them back.
drop policy if exists "Anyone sends a message" on public.contact_messages;
create policy "Anyone sends a message" on public.contact_messages
    for insert to anon, authenticated
    with check (status = 'new');

drop policy if exists "Admins read messages" on public.contact_messages;
create policy "Admins read messages" on public.contact_messages
    for select to authenticated
    using (public.is_admin());

drop policy if exists "Admins update messages" on public.contact_messages;
create policy "Admins update messages" on public.contact_messages
    for update to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "Admins delete messages" on public.contact_messages;
create policy "Admins delete messages" on public.contact_messages
    for delete to authenticated
    using (public.is_admin());

-- ADMINS: no policies on purpose -> not readable or writable through the API.


-- -----------------------------------------------------------------------------
-- 4. SEED DATA (only inserted when the catalog is empty)
-- -----------------------------------------------------------------------------

insert into public.services
    (name_en, name_es, description_en, description_es, category, price, duration_minutes, sort_order)
select * from (values
    ('Full computer diagnosis', 'Diagnóstico completo del equipo',
     'We test hardware, storage, memory and system health to find the real cause of the problem before any repair.',
     'Revisamos hardware, almacenamiento, memoria y estado del sistema para encontrar la causa real antes de reparar.',
     'support', 15.00, 30, 10),
    ('Virus and malware removal', 'Eliminación de virus y malware',
     'Deep scan and cleanup of viruses, adware and unwanted programs, plus browser reset and security tips.',
     'Análisis profundo y limpieza de virus, publicidad y programas no deseados, con restablecimiento del navegador y consejos de seguridad.',
     'repair', 35.00, 90, 20),
    ('Operating system reinstall', 'Reinstalación del sistema operativo',
     'Clean Windows installation with drivers and updates. We back up your documents first.',
     'Instalación limpia de Windows con controladores y actualizaciones. Primero respaldamos tus documentos.',
     'repair', 45.00, 120, 30),
    ('Internal cleaning and thermal paste', 'Limpieza interna y pasta térmica',
     'Dust removal from fans and heatsinks and new thermal paste to stop overheating and noise.',
     'Quitamos el polvo de ventiladores y disipadores y cambiamos la pasta térmica para evitar sobrecalentamiento y ruido.',
     'maintenance', 30.00, 60, 40),
    ('SSD upgrade with data migration', 'Cambio a SSD con migración de datos',
     'We install a solid state drive and move your system and files so the computer starts and runs much faster.',
     'Instalamos una unidad de estado sólido y movemos tu sistema y archivos para que el equipo arranque y funcione mucho más rápido.',
     'upgrade', 40.00, 90, 50),
    ('RAM memory upgrade', 'Ampliación de memoria RAM',
     'We check which memory is compatible, install it and test it so you can open more programs without slowdowns.',
     'Verificamos qué memoria es compatible, la instalamos y la probamos para que abras más programas sin lentitud.',
     'upgrade', 20.00, 30, 60),
    ('Blue screen repair', 'Reparación de pantallazo azul',
     'We read the error code, fix drivers or system files and test the hardware that caused the crash.',
     'Leemos el código de error, corregimos controladores o archivos del sistema y probamos el hardware que causó el fallo.',
     'repair', 40.00, 120, 70),
    ('Remote support session', 'Sesión de soporte remoto',
     'A technician connects to your computer online to solve software problems without leaving home.',
     'Un técnico se conecta a tu computadora por internet para resolver problemas de software sin salir de casa.',
     'support', 20.00, 45, 80)
) as seed (name_en, name_es, description_en, description_es, category, price, duration_minutes, sort_order)
where not exists (select 1 from public.services);


-- -----------------------------------------------------------------------------
-- 5. MAKE YOURSELF ADMIN (run AFTER creating your user)
-- Dashboard > Authentication > Users > Add user (email + password, auto confirm).
-- Then replace the email below and run only this statement.
-- -----------------------------------------------------------------------------
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'your-admin-email@example.com'
-- on conflict do nothing;
