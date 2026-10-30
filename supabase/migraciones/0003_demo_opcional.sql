-- El Hincha · catálogo de DEMOSTRACIÓN (opcional). Úsalo para ver la tienda funcionando;
-- las fotos son de muestra. Para empezar en limpio, no lo ejecutes o borra estos datos
-- desde el admin.

insert into equipos (id, liga_id, nombre, orden) values
  ('e-real-madrid', 'l-laliga',           'Real Madrid',        0),
  ('e-barcelona',   'l-laliga',           'FC Barcelona',       1),
  ('e-atletico',    'l-laliga',           'Atlético de Madrid', 2),
  ('e-man-city',    'l-premier',          'Manchester City',    3),
  ('e-arsenal',     'l-premier',          'Arsenal',            4),
  ('e-bayern',      'l-bundesliga',       'Bayern Múnich',      5),
  ('e-dortmund',    'l-bundesliga',       'Borussia Dortmund',  6),
  ('e-inter-miami', 'l-mls',              'Inter Miami',        7),
  ('e-emelec',      'l-nacionales',       'Emelec',             8),
  ('e-bsc',         'l-nacionales',       'Barcelona SC',       9),
  ('e-ldu',         'l-nacionales',       'Liga de Quito',     10),
  ('e-brasil',      'l-brasil-argentina', 'Brasil',            11),
  ('e-argentina',   'l-brasil-argentina', 'Argentina',         12),
  ('e-ecuador',     'l-retro',            'Ecuador',           13),
  ('e-hincha',      'l-musculeras',       'El Hincha',         14);

insert into productos (id, slug, equipo_id, tipo_id, nombre, destacado, fotos, parches_permitidos) values
  ('pr-real-madrid-local-25-26',  'real-madrid-local-25-26',  'e-real-madrid', 't-player',    'Local 25/26',       true,  array['/mock/detalle-1.jpg','/mock/prod-1.jpg','/mock/detalle-2.jpg'], array['p-ucl','p-laliga']),
  ('pr-real-madrid-short-local',  'real-madrid-short-local',  'e-real-madrid', 't-short',     'Short Local 25/26', false, array['/mock/short.jpg'],   '{}'),
  ('pr-barcelona-local-25-26',    'barcelona-local-25-26',    'e-barcelona',   't-player',    'Local 25/26',       false, array['/mock/prod-2.jpg','/mock/detalle-3.jpg'], array['p-ucl','p-laliga']),
  ('pr-barcelona-visitante-25-26','barcelona-visitante-25-26','e-barcelona',   't-player',    'Visitante 25/26',   false, array['/mock/prod-5.jpg'],  array['p-ucl','p-laliga']),
  ('pr-atletico-local-25-26',     'atletico-local-25-26',     'e-atletico',    't-player',    'Local 25/26',       false, array['/mock/prod-3.jpg'],  array['p-ucl','p-laliga']),
  ('pr-man-city-local-25-26',     'man-city-local-25-26',     'e-man-city',    't-player',    'Local 25/26',       false, array['/mock/prod-6.jpg'],  array['p-ucl','p-epl']),
  ('pr-arsenal-local-25-26',      'arsenal-local-25-26',      'e-arsenal',     't-player',    'Local 25/26',       false, array['/mock/prod-9.jpg'],  array['p-ucl','p-epl']),
  ('pr-bayern-local-25-26',       'bayern-local-25-26',       'e-bayern',      't-player',    'Local 25/26',       true,  array['/mock/detalle-3.jpg','/mock/prod-1.jpg'], array['p-ucl','p-bundes']),
  ('pr-dortmund-local-25-26',     'dortmund-local-25-26',     'e-dortmund',    't-player',    'Local 25/26',       false, array['/mock/prod-8.jpg'],  array['p-ucl','p-bundes']),
  ('pr-inter-miami-local',        'inter-miami-local',        'e-inter-miami', 't-player',    'Local 2026',        false, array['/mock/prod-2.jpg'],  '{}'),
  ('pr-emelec-local-2025',        'emelec-local-2025',        'e-emelec',      't-player',    'Local 2025',        true,  array['/mock/prod-7.jpg'],  array['p-ligapro','p-lib']),
  ('pr-bsc-amarilla-2025',        'bsc-amarilla-2025',        'e-bsc',         't-player',    'Local 2025',        false, array['/mock/prod-8.jpg'],  array['p-ligapro','p-lib']),
  ('pr-ldu-local-2025',           'ldu-local-2025',           'e-ldu',         't-player',    'Local 2025',        false, array['/mock/prod-6.jpg'],  array['p-ligapro','p-lib']),
  ('pr-brasil-local-2026',        'brasil-local-2026',        'e-brasil',      't-player',    'Local 2026',        false, array['/mock/prod-8.jpg'],  array['p-wc']),
  ('pr-argentina-local-2026',     'argentina-local-2026',     'e-argentina',   't-player',    'Local 2026',        false, array['/mock/prod-5.jpg'],  array['p-wc']),
  ('pr-ecuador-mundial-2002',     'ecuador-mundial-2002',     'e-ecuador',     't-retro',     'Mundial 2002',      true,  array['/mock/prod-9.jpg'],  array['p-wc']),
  ('pr-musculera-hincha-navy',    'musculera-hincha-navy',    'e-hincha',      't-musculera', 'Musculera Hincha Navy', false, array['/mock/prod-10.jpg'], '{}');

-- Un drop abierto de 30 días desde hoy, para probar la cuenta regresiva y el carrito.
insert into drops (id, nombre, abre_en, cierra_en, envio_en, estado) values
  ('d-demo', 'Drop de prueba', now(), now() + interval '30 days', now() + interval '31 days', 'abierto');
