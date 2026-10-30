-- El Hincha · eliminar una liga borra sus equipos y camisetas en UNA sola operación
-- (todo o nada). Ejecutar después de 0004.
--
-- Los pedidos anteriores no se afectan: cada pedido guarda una copia fija de lo pedido.
-- El admin pide escribir el nombre de la liga antes de eliminar; lo normal es ocultarla.

alter table equipos
  drop constraint if exists equipos_liga_id_fkey,
  add constraint equipos_liga_id_fkey foreign key (liga_id) references ligas(id) on delete cascade;

alter table productos
  drop constraint if exists productos_equipo_id_fkey,
  add constraint productos_equipo_id_fkey foreign key (equipo_id) references equipos(id) on delete cascade;
