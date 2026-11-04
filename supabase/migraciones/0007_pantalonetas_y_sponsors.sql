-- El Hincha · pantalonetas del combo y versión sin patrocinadores. Ejecutar después de 0006.
--
-- 1) Al elegir un combo, el cliente escoge la pantaloneta (Player, Fan, Retro…) y su talla,
--    que puede ser distinta a la de la camiseta. El «extra» se suma al precio del combo.
-- 2) Cada camiseta puede ofrecer la versión SIN sponsors (gratis): el cliente elige con o sin.
-- Los precios siguen en numeric(10,2): 43.99 y 54.00 se guardan exactos.

create table shorts_combo (
  id      text primary key,
  nombre  text not null check (length(nombre) between 2 and 40),
  foto    text not null default '',
  extra   numeric(10,2) not null default 0 check (extra >= 0),
  tallas  text[] not null default array['S','M','L','XL'],
  activo  boolean not null default true,
  orden   int not null default 0
);
alter table shorts_combo enable row level security;

-- Para que el combo existente siga funcionando: una pantaloneta por defecto, sin extra.
-- La foto se sube desde Admin → Precios y combos.
insert into shorts_combo (id, nombre, extra, tallas, orden)
values ('sh-player', 'Short Player', 0, array['XS','S','M','L','XL','XXL'], 0)
on conflict (id) do nothing;

alter table productos add column if not exists version_sin_sponsors boolean not null default false;
