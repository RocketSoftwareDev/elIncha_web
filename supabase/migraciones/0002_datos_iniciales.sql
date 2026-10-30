-- El Hincha · datos que la tienda necesita para funcionar. Ejecutar después de 0001.
-- Todo se puede cambiar luego desde el admin.

insert into tipos_prenda (id, nombre, precio, acepta_personalizacion, es_short, orden) values
  ('t-player',    'Camiseta Player',                 40, true,  false, 0),
  ('t-retro',     'Retro',                           38, true,  false, 1),
  ('t-buzo',      'Buzo',                            40, false, false, 2),
  ('t-musculera', 'Musculera',                       27, false, false, 3),
  ('t-coach',     'Camisa de entrenamiento / Coach', 27, false, false, 4),
  ('t-short',     'Short Player',                    20, true,  true,  5);

insert into parches (id, nombre, precio) values
  ('p-ucl',     'Champions League',  1),
  ('p-lib',     'Copa Libertadores', 1),
  ('p-wc',      'Copa Mundial',      1),
  ('p-ligapro', 'LigaPro Ecuador',   1),
  ('p-epl',     'Premier League',    1),
  ('p-laliga',  'LaLiga',            1),
  ('p-bundes',  'Bundesliga',        1);

insert into combos (id, nombre, precio, tipos) values
  ('c-kit', 'Kit completo', 55, array['t-player','t-short']);

insert into ligas (id, slug, nombre, foto, orden) values
  ('l-laliga',           'laliga',           'LaLiga',             '/mock/liga-laliga.jpg',           0),
  ('l-premier',          'premier',          'Premier League',     '/mock/liga-premier.jpg',          1),
  ('l-bundesliga',       'bundesliga',       'Bundesliga',         '/mock/liga-bundesliga.jpg',       2),
  ('l-mls',              'mls',              'MLS',                '/mock/liga-mls.jpg',              3),
  ('l-nacionales',       'nacionales',       'Nacionales',         '/mock/liga-nacionales.jpg',       4),
  ('l-brasil-argentina', 'brasil-argentina', 'Brasil y Argentina', '/mock/liga-brasil-argentina.jpg', 5),
  ('l-retro',            'retro',            'Retro',              '/mock/liga-retro.jpg',            6),
  ('l-musculeras',       'musculeras',       'Musculeras',         '/mock/liga-musculeras.jpg',       7);

-- El número de WhatsApp es de ejemplo: cámbialo en Admin → Ajustes y pagos.
insert into ajustes (id, datos) values (1, '{
  "whatsapp": "+593 99 999 9999",
  "horario": "Lun a Sáb · 9:00 – 20:00",
  "saludo": "¡Hola El Hincha! ⚽ Quiero hacer este pedido",
  "montoReserva": 5,
  "metodosPago": [
    {"id": "transferencia", "nombre": "Transferencia bancaria", "detalle": "Banco Pichincha · Cta. ahorros", "activo": true},
    {"id": "deuna", "nombre": "DeUna / transferencia QR", "detalle": "Te enviamos el QR por chat", "activo": true},
    {"id": "efectivo", "nombre": "Efectivo contra entrega", "detalle": "Solo Machala", "activo": false}
  ],
  "pasosComoComprar": [
    "Elige liga, equipo y talla. Nombre y número van gratis.",
    "Te llega todo listo en un mensaje. Confirmamos tallas y personalización.",
    "Por transferencia o DeUna. El resto lo coordinamos contigo por chat.",
    "Después del cierre del drop. Te avisamos por chat y te la entregamos en Machala."
  ],
  "redes": {"instagram": "@elhincha.machala", "tiktok": "@elhincha.ec", "facebook": "El Hincha Machala"}
}'::jsonb);
