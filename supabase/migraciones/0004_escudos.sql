-- El Hincha · escudos de equipos. Ejecutar después de 0001–0003.
-- Las imágenes de ligas ya tenían su columna (ligas.foto); ahora el admin puede cambiarlas.
-- Archivos en el bucket «fotos»: ligas/{id}/…webp y equipos/{id}/…webp (se crean solos).

alter table equipos add column if not exists escudo text not null default '';

-- Los escudos son PNG/WebP con transparencia: el bucket sigue aceptando solo WebP
-- (el navegador convierte la imagen antes de subirla).
