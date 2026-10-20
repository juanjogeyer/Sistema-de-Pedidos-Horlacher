-- 001 · seller_id en orders
--
-- Contexto: hasta ahora el sistema lo usaba un solo vendedor y los pedidos no
-- tenian dueno. Con dos vendedores hace falta saber quien cargo cada uno.
--
-- Este archivo NO se ejecuta solo. El repo no tiene herramienta de migraciones;
-- queda como registro de que se le hizo a la base y cuando. El SQL se corre a
-- mano en el editor del dashboard de Supabase.
--
-- Diseno: ver docs/superpowers/specs/2026-08-07-multi-vendedor-design.md
--
-- ─────────────────────────────────────────────────────────────────────────────
-- EL ORDEN IMPORTA
--
-- Mientras se toca la base hay codigo viejo corriendo en los celulares de los
-- vendedores, y ese codigo inserta pedidos sin seller_id. Por eso la columna
-- nace nullable y recien se vuelve obligatoria despues del deploy.
--
-- Como Vercel deploya al mergear a main, el merge del PR *es* el paso 3.
--
--   Paso 1 y 2  →  antes del merge. Se pueden correr dias antes: agregar una
--                  columna nullable no rompe nada de lo que ya funciona.
--   Paso 3      →  merge del PR dev → main. Vercel deploya. Desde aca todo
--                  pedido nuevo trae seller_id.
--   Paso 4 y 5  →  despues del merge. Pueden esperar al dia siguiente.
--
-- Poner el NOT NULL antes del merge hace fallar todo envio desde una pestana
-- que todavia tenga el codigo viejo cargado.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Paso 1 ── ANTES del merge ───────────────────────────────────────────────
-- Nullable a proposito: el codigo viejo sigue insertando sin este campo.

ALTER TABLE orders ADD COLUMN seller_id text;


-- ── Paso 2 ── ANTES del merge ───────────────────────────────────────────────
-- Los pedidos existentes los cargo Eduardo Horlacher, que era el unico usuario
-- del sistema. Confirmado por el dueno del producto el 2026-08-07.

UPDATE orders SET seller_id = 'eduardo' WHERE seller_id IS NULL;


-- ── Verificacion ── correr despues del paso 2 ───────────────────────────────
-- Tiene que devolver 0. Si devuelve otra cosa, no seguir.

-- SELECT count(*) FROM orders WHERE seller_id IS NULL;


-- ── Paso 3 ── merge del PR dev → main ───────────────────────────────────────
-- No hay SQL. Vercel deploya el codigo nuevo, que ya manda seller_id.


-- ── Paso 4 ── DESPUES del merge ─────────────────────────────────────────────
-- Barre lo que haya entrado entre el paso 2 y el deploy.

-- UPDATE orders SET seller_id = 'eduardo' WHERE seller_id IS NULL;


-- ── Paso 5 ── DESPUES del merge ─────────────────────────────────────────────
-- Recien ahora la columna puede ser obligatoria: ya no queda codigo viejo
-- insertando sin ella. Si este comando falla, es que quedo alguna fila sin
-- dueno: volver al paso 4.

-- ALTER TABLE orders ALTER COLUMN seller_id SET NOT NULL;


-- ── Marcha atras ────────────────────────────────────────────────────────────
-- Los pasos 1 y 2 son aditivos y se revierten con:
--
--   ALTER TABLE orders DROP COLUMN seller_id;
