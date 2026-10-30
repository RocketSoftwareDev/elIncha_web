-- El Hincha · stock de ENTREGA INMEDIATA (sobrantes). Ejecutar después de 0005.
--
-- Camisetas que ya están en Machala (por ejemplo, pedidos que no se pagaron): se venden
-- SIN personalizar y aunque no haya drop abierto. Una fila por camiseta y talla.
-- La unidad se aparta al crear el pedido y vuelve al stock si el admin lo cancela.

create table stock (
  id          text primary key,
  producto_id text not null references productos(id) on delete cascade,
  talla       text not null check (length(talla) between 1 and 4),
  cantidad    int  not null check (cantidad >= 0),
  precio      numeric(10,2) check (precio > 0), -- null = el precio normal del producto
  creado_en   timestamptz not null default now(),
  unique (producto_id, talla)
);
alter table stock enable row level security;

-- Un pedido solo de stock no pertenece a ningún drop.
alter table pedidos alter column drop_id drop not null;

-- Crea el pedido y aparta el stock en UNA transacción: si falta una unidad, no se crea nada.
-- Las prendas de stock traen «stockId» y «cantidad» dentro de items.
create or replace function crear_pedido(p jsonb) returns text
language plpgsql set search_path = public as $$
declare
  it jsonb;
  v_codigo text;
begin
  for it in select * from jsonb_array_elements(p -> 'items') loop
    if it ->> 'stockId' is not null then
      update stock set cantidad = cantidad - (it ->> 'cantidad')::int
       where id = it ->> 'stockId' and cantidad >= (it ->> 'cantidad')::int;
      if not found then
        raise exception 'SIN_STOCK' using errcode = 'P0001', detail = it ->> 'stockId';
      end if;
    end if;
  end loop;

  insert into pedidos (drop_id, cliente_nombre, cliente_whatsapp, sector, total, reserva, estado, items)
  values (p ->> 'dropId', p ->> 'clienteNombre', p ->> 'clienteWhatsapp', p ->> 'sector',
          (p ->> 'total')::numeric, (p ->> 'reserva')::numeric, 'por_confirmar', p -> 'items')
  returning codigo into v_codigo;
  return v_codigo;
end $$;

-- Cambia el estado y mueve el stock: cancelar devuelve las unidades; reactivar un
-- pedido cancelado las vuelve a apartar (falla si ya se vendieron).
create or replace function cambiar_estado_pedido(p_codigo text, p_estado text) returns void
language plpgsql set search_path = public as $$
declare
  v_actual text;
  v_items jsonb;
  it jsonb;
begin
  select estado, items into v_actual, v_items from pedidos where codigo = p_codigo for update;
  if not found then raise exception 'NO_PEDIDO' using errcode = 'P0001'; end if;
  if v_actual = p_estado then return; end if;

  if p_estado = 'cancelado' then
    for it in select * from jsonb_array_elements(v_items) loop
      if it ->> 'stockId' is not null then
        update stock set cantidad = cantidad + (it ->> 'cantidad')::int where id = it ->> 'stockId';
      end if;
    end loop;
  elsif v_actual = 'cancelado' then
    for it in select * from jsonb_array_elements(v_items) loop
      if it ->> 'stockId' is not null then
        update stock set cantidad = cantidad - (it ->> 'cantidad')::int
         where id = it ->> 'stockId' and cantidad >= (it ->> 'cantidad')::int;
        if not found then raise exception 'SIN_STOCK' using errcode = 'P0001', detail = it ->> 'stockId'; end if;
      end if;
    end loop;
  end if;

  update pedidos set estado = p_estado where codigo = p_codigo;
end $$;

-- El admin suma o resta unidades. Se suma EN la base (no se reescribe el número que
-- vio en pantalla) para no pisar un pedido que entró al mismo tiempo. Nunca baja de 0.
create or replace function sumar_stock(p_id text, p_delta int) returns int
language plpgsql set search_path = public as $$
declare v int;
begin
  update stock set cantidad = greatest(0, cantidad + p_delta) where id = p_id returning cantidad into v;
  return v;
end $$;

-- Solo el servidor (llave de servicio) puede llamar estas funciones.
revoke execute on function crear_pedido(jsonb) from public, anon, authenticated;
revoke execute on function cambiar_estado_pedido(text, text) from public, anon, authenticated;
revoke execute on function sumar_stock(text, int) from public, anon, authenticated;
grant execute on function crear_pedido(jsonb) to service_role;
grant execute on function cambiar_estado_pedido(text, text) to service_role;
grant execute on function sumar_stock(text, int) to service_role;
