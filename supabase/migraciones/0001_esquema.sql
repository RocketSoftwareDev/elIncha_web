-- El Hincha · esquema para la etapa gratis (Netlify + Supabase).
-- Ejecutar una vez en Supabase: SQL Editor → pegar → Run.
--
-- Seguridad: RLS activado en TODAS las tablas y SIN políticas. Así la llave pública
-- (anon) no puede leer ni escribir nada. Solo el servidor de Next, con la llave de
-- servicio (variable secreta en Netlify), accede a los datos.

create extension if not exists pgcrypto;

-- ---------- Catálogo ----------

create table ligas (
  id      text primary key,
  slug    text not null unique check (slug ~ '^[a-z0-9-]{1,40}$'),
  nombre  text not null check (length(nombre) between 1 and 60),
  foto    text not null default '',
  orden   int  not null default 0,
  visible boolean not null default true
);

create table equipos (
  id      text primary key,
  liga_id text not null references ligas(id) on delete restrict,
  nombre  text not null check (length(nombre) between 1 and 60),
  orden   int  not null default 0
);

create table tipos_prenda (
  id                     text primary key,
  nombre                 text    not null,
  precio                 numeric(10,2) not null check (precio > 0),
  tallas                 text[]  not null default array['XS','S','M','L','XL','XXL'],
  acepta_personalizacion boolean not null default false,
  es_short               boolean not null default false,
  orden                  int     not null default 0
);

create table parches (
  id     text primary key,
  nombre text not null,
  precio numeric(10,2) not null default 1 check (precio >= 0),
  activo boolean not null default true
);

create table productos (
  id                 text primary key,
  slug               text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  equipo_id          text not null references equipos(id) on delete restrict,
  tipo_id            text not null references tipos_prenda(id) on delete restrict,
  nombre             text not null check (length(nombre) between 1 and 80),
  precio_especial    numeric(10,2) check (precio_especial > 0),
  visible            boolean not null default true,
  destacado          boolean not null default false,
  fotos              text[]  not null default '{}',
  parches_permitidos text[]  not null default '{}'
);

-- El cliente los elige como una opción más: no se aplican solos.
create table combos (
  id     text primary key,
  nombre text not null,
  precio numeric(10,2) not null check (precio > 0),
  activo boolean not null default true,
  tipos  text[]  not null check (cardinality(tipos) >= 2)
);

-- ---------- Drops ----------

create table drops (
  id                       text primary key,
  nombre                   text not null,
  abre_en                  timestamptz not null,
  cierra_en                timestamptz not null check (cierra_en > abre_en),
  envio_en                 timestamptz not null,
  llegada_min_dias         int not null default 20 check (llegada_min_dias between 0 and 120),
  llegada_max_dias         int not null default 30 check (llegada_max_dias between 0 and 120),
  estado                   text not null default 'borrador'
                           check (estado in ('borrador','abierto','cerrado','en_camino','entregado')),
  mostrar_cuenta_regresiva boolean not null default true
);

-- Regla del negocio: solo un drop abierto a la vez.
create unique index drops_un_solo_abierto on drops ((true)) where estado = 'abierto';

-- ---------- Ajustes (una sola fila) ----------

create table ajustes (
  id    int primary key default 1 check (id = 1),
  datos jsonb not null
);

-- ---------- Pedidos ----------

create sequence pedido_codigo_seq start 1;

-- Las prendas se guardan como foto fija (jsonb): si mañana cambia un precio,
-- el pedido sigue diciendo lo que el cliente pidió.
create table pedidos (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null unique default ('EH-' || lpad(nextval('pedido_codigo_seq')::text, 4, '0')),
  drop_id          text not null references drops(id) on delete restrict,
  cliente_nombre   text not null check (length(cliente_nombre) between 2 and 60),
  cliente_whatsapp text not null check (length(cliente_whatsapp) between 7 and 20),
  sector           text not null check (length(sector) between 2 and 80),
  total            numeric(10,2) not null check (total >= 0),
  reserva          numeric(10,2) not null check (reserva >= 0),
  estado           text not null default 'por_confirmar'
                   check (estado in ('por_confirmar','reserva_pagada','pagado','entregado','cancelado')),
  items            jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 20),
  creado_en        timestamptz not null default now()
);
create index pedidos_drop on pedidos (drop_id, creado_en desc);

-- ---------- Estadísticas propias (sin IP, sin cookies) ----------

create table eventos (
  id          bigserial primary key,
  tipo        text not null check (tipo in ('vista','agregar_carrito','busqueda_vacia')),
  ruta        text check (length(ruta) <= 120),
  producto_id text,
  termino     text check (length(termino) <= 60),
  visitante   text not null check (visitante ~ '^[0-9a-f]{16}$'),
  fuente      text not null check (fuente in ('instagram','google','whatsapp','facebook','directo','otro')),
  dispositivo text not null check (dispositivo in ('celular','computadora')),
  creado_en   timestamptz not null default now()
);
create index eventos_fecha on eventos (creado_en);

-- ---------- Límites contra abuso (login, pedidos, avisos) ----------

create table intentos (
  id        bigserial primary key,
  clave     text not null check (length(clave) <= 80),
  creado_en timestamptz not null default now()
);
create index intentos_clave on intentos (clave, creado_en);

-- ---------- RLS: cerrado para todos menos la llave de servicio ----------

alter table ligas        enable row level security;
alter table equipos      enable row level security;
alter table tipos_prenda enable row level security;
alter table parches      enable row level security;
alter table productos    enable row level security;
alter table combos       enable row level security;
alter table drops        enable row level security;
alter table ajustes      enable row level security;
alter table pedidos      enable row level security;
alter table eventos      enable row level security;
alter table intentos     enable row level security;

-- ---------- Fotos: lectura pública, escritura solo con la llave de servicio ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 2097152, array['image/webp'])
on conflict (id) do nothing;

-- ---------- Limpieza diaria (pg_cron viene incluido en Supabase) ----------
-- Si esta parte falla, actívalo en Database → Extensions → pg_cron y vuelve a correrla.

create extension if not exists pg_cron;
select cron.schedule(
  'elhincha-limpieza',
  '15 8 * * *',
  $$ delete from eventos  where creado_en < now() - interval '180 days';
     delete from intentos where creado_en < now() - interval '2 days'; $$
);
