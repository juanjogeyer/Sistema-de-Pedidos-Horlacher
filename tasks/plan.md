# Implementation Plan: Multi-vendedor con roles y cola de impresión

**Spec:** [`docs/superpowers/specs/2026-08-07-multi-vendedor-design.md`](../docs/superpowers/specs/2026-08-07-multi-vendedor-design.md)
**Rama:** `dev` → PR a `main`
**Fecha:** 2026-08-07

---

## Overview

Convertir una app de un solo usuario sin autenticación en una de tres usuarios
con dos roles: dos vendedores que cargan pedidos y ven solo los propios, y un
admin que ve los de ambos y es el único que imprime.

El trabajo se ordena para que **la app quede funcionando después de cada tarea**.
Las primeras cuatro no cambian ni un comportamiento visible: instalan tests y
desenredan código que hoy está duplicado. Recién en la fase 2 aparece el login, y
en la fase 3 la separación por rol.

---

## Architecture Decisions

Tomadas en el spec, se repiten acá porque condicionan el orden de las tareas:

- **Dos árboles de componentes**, no condicionales por rol. El botón Imprimir no
  existe en el árbol del vendedor. Esto obliga a que `useOrders` se parta en tres
  hooks *antes* de crear las dos apps.
- **`useOrderPrinting` es prerequisito, no limpieza.** Hoy hay dos
  implementaciones de PDF divergentes; `AdminApp` necesita una sola compartida
  entre Cola de impresión y Reimprimir. Por eso va en la fase 1.
- **La migración es aditiva y en dos tiempos.** Los pasos 1–2 (columna nullable +
  backfill) se corren temprano y no rompen nada. Los pasos 4–5 (`NOT NULL`) van
  después del merge, porque antes del deploy hay código viejo insertando sin
  `seller_id`.
- **Los tests mockean Supabase.** Ninguna tarea automatizada toca la base real.

---

## Dependency Graph

```
package.json (deps de test + deps de PDF)
    │
    ├── setup vitest ──────────────────┐
    │                                  │
    ├── useOrderPrinting ──────┐       │
    ├── OrderCard ─────────────┤       │
    │                          │       │
config/users.js                │       │
    │                          │       │
    └── useAuth ──── Login     │       │
            │                  │       │
            └── App (dispatch) │       │
                    │          │       │
orders.seller_id    │          │       │
    │               │          │       │
    └── useOrdersQuery         │       │
            ├── useVendorOrders├── VendorApp
            └── useAdminOrders └── AdminApp
                                       │
                                    tests
```

Orden: bottom-up. Nada que dependa de `seller_id` se construye antes de que la
columna exista.

---

## Task List

### Fase 1 — Base, sin cambio de comportamiento

## Task 1: Infraestructura de testing

**Description:** Instalar vitest + Testing Library + jsdom y dejar un mock del
cliente de Supabase reutilizable. Sin esto, ninguna tarea posterior se puede
verificar automáticamente. Es la tarea de mayor incertidumbre del plan, por eso
va primera: si el mock no sirve, conviene saberlo ahora.

**Acceptance criteria:**
- [ ] `npm test` corre y pasa con al menos un test trivial.
- [ ] Existe un mock de `src/lib/supabase.js` que permite afirmar sobre la cadena
      de llamadas (`.from().select().eq()`) y fijar la respuesta.
- [ ] El mock cubre `select`, `insert`, `update`, `delete`, `eq`, `order` y
      `channel`, que son los métodos que usa el código actual.

**Verification:**
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run lint`

**Dependencies:** Ninguna

**Files likely touched:**
- `package.json`
- `vite.config.js`
- `src/test/setup.js`
- `src/test/supabaseMock.js`

**Estimated scope:** M

---

## Task 2: Corregir las dependencias declaradas

**Description:** `html2canvas` y `jspdf` se importan pero no están declarados;
resuelven como dependencias transitivas de `html2pdf.js`. `@vercel/blob` y
`pdfkit` están declarados y no se importan en ningún lado.

**Acceptance criteria:**
- [ ] `html2canvas` y `jspdf` figuran en `dependencies`.
- [ ] `@vercel/blob` y `pdfkit` ya no figuran.
- [ ] `html2pdf.js` sigue declarado (lo saca la Task 3, cuando queda sin uso).

**Verification:**
- [ ] `npm run build`
- [ ] Manual: abrir Pendientes e Historial, imprimir uno de cada, comparar los
      dos PDF con los de antes del cambio.

**Dependencies:** Ninguna

**Files likely touched:**
- `package.json`

**Estimated scope:** XS

---

## Task 3: Extraer `useOrderPrinting` y unificar los dos caminos de PDF

**Description:** `PendingOrders` genera el PDF con `html2canvas` + `jsPDF` a mano
y ajusta el resultado a una hoja A4. `OrderHistory` hace lo mismo con
`html2pdf.js` y **sin** el ajuste, así que un pedido largo reimpreso se parte en
dos hojas. Se unifican en un hook, conservando la versión con ajuste.

**Acceptance criteria:**
- [ ] `useOrderPrinting` expone lo necesario para generar el PDF y abrir el
      diálogo de impresión, y es el único módulo que importa `html2canvas` o
      `jspdf`.
- [ ] `html2pdf.js` sale de `package.json`.
- [ ] El PDF del historial ahora entra en una sola hoja A4.

**Verification:**
- [ ] `npx vitest run src/hooks/useOrderPrinting.test.js` (caso 13 del spec)
- [ ] `npm run build`
- [ ] Manual: imprimir desde Pendientes y reimprimir desde Historial el mismo
      pedido largo; ambos PDF deben ser una sola hoja y verse iguales.

**Dependencies:** Task 1, Task 2

**Files likely touched:**
- `src/hooks/useOrderPrinting.js`
- `src/hooks/useOrderPrinting.test.js`
- `src/components/orders/PendingOrders.jsx`
- `src/components/orders/OrderHistory.jsx`
- `package.json`

**Estimated scope:** M

---

## Task 4: Extraer `OrderCard`

**Description:** La tarjeta de pedido está duplicada casi textual en
`PendingOrders` y `OrderHistory`. Se extrae a un componente presentacional puro
que recibe `order`, `showSeller` y `actions` como slot. Sin esto, la fase 3
crearía una tercera copia.

**Acceptance criteria:**
- [ ] `OrderCard` no conoce roles ni permisos: dibuja el pedido y renderiza los
      botones que le pasen.
- [ ] `PendingOrders` y `OrderHistory` lo usan y ya no tienen markup de tarjeta
      propio.
- [ ] La pantalla se ve igual que antes en ambas pestañas.

**Verification:**
- [ ] `npx vitest run src/components/orders/OrderCard.test.jsx` (caso 11)
- [ ] `npm run build`
- [ ] Manual: comparar Pendientes e Historial contra capturas previas.

**Dependencies:** Task 1

**Files likely touched:**
- `src/components/orders/OrderCard.jsx`
- `src/components/orders/OrderCard.test.jsx`
- `src/components/orders/PendingOrders.jsx`
- `src/components/orders/OrderHistory.jsx`

**Estimated scope:** M

---

### Checkpoint A — Base

- [ ] `npm test` verde
- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin warnings
- [ ] **La app se comporta exactamente igual que antes de empezar.** Cargar
      pedido, imprimir, reimprimir, borrar: todo idéntico.
- [ ] Revisar con el humano antes de seguir

Hasta acá el trabajo es mergeable por sí solo si hiciera falta cortar.

---

### Fase 2 — Identidad

## Task 5: Migración de base, pasos 1 y 2

**Description:** Agregar la columna `seller_id` (nullable) y atribuir los pedidos
existentes a Eduardo Horlacher. Aditivo: el código viejo sigue funcionando porque
la columna admite `NULL`.

**Acceptance criteria:**
- [ ] `supabase/migrations/001-seller-id.sql` existe en el repo con los cinco
      pasos documentados y marcado cuáles se corrieron.
- [ ] En la base: la columna existe y ninguna fila tiene `seller_id IS NULL`.

**Verification:**
- [ ] Manual, en el editor SQL del dashboard:
      `SELECT count(*) FROM orders WHERE seller_id IS NULL;` devuelve 0.
- [ ] Manual: la app en producción sigue funcionando sin cambios.

**Dependencies:** Ninguna

**Files likely touched:**
- `supabase/migrations/001-seller-id.sql`

**Estimated scope:** XS — **la corre el humano, no el agente.**

---

## Task 6: `config/users.js` y `useAuth`

**Description:** La lista de usuarios con rol y PIN, y el hook de sesión que
guarda solo el `id` en `localStorage` y lo resuelve contra el config en cada
arranque.

**Acceptance criteria:**
- [ ] `useAuth` expone `{ user, login(id, pin), logout() }`.
- [ ] Un `id` guardado que no está en `USERS` limpia la sesión.
- [ ] `localStorage` que tira excepción no rompe la app.
- [ ] El PIN nunca se persiste.

**Verification:**
- [ ] `npx vitest run src/hooks/useAuth.test.js` (casos 1, 2, 3)
- [ ] `npm run build`

**Dependencies:** Task 1

**Files likely touched:**
- `src/config/users.js`
- `src/hooks/useAuth.js`
- `src/hooks/useAuth.test.js`

**Estimated scope:** M

---

## Task 7: Pantalla de Login y gate de sesión

**Description:** Los tres usuarios como botones grandes; al tocar uno aparece un
teclado numérico de 3 casilleros que valida al tercer dígito. `App.jsx` muestra
Login si no hay sesión. Todavía sin roles: cualquiera entra a la app actual.

**Acceptance criteria:**
- [ ] PIN incorrecto muestra mensaje inline y limpia los casilleros, sin bloqueo.
- [ ] PIN correcto entra y la sesión sobrevive a recargar.
- [ ] Botón "Salir" en el Header.

**Verification:**
- [ ] `npx vitest run src/components/auth/Login.test.jsx` (caso 8)
- [ ] `npm run build`
- [ ] Manual: entrar con cada uno de los tres PIN, recargar, salir.

**Dependencies:** Task 6

**Files likely touched:**
- `src/components/auth/Login.jsx`
- `src/components/auth/Login.test.jsx`
- `src/App.jsx`
- `src/components/layout/Header.jsx`

**Estimated scope:** M

---

### Checkpoint B — Identidad

- [ ] `npm test` verde
- [ ] Los tres usuarios entran con su PIN
- [ ] Detrás del login, la app funciona igual que hoy (todos ven todo, todavía)
- [ ] Revisar con el humano antes de seguir

---

### Fase 3 — Separación por rol

## Task 8: Partir `useOrders` en tres hooks

**Description:** `useOrdersQuery(filter)` se queda con fetch, realtime y polling.
`useVendorOrders(user)` filtra por `seller_id`, inyecta el `seller_id` al crear y
expone `cancelOrder` con las tres guardas. `useAdminOrders()` no filtra y expone
`printOrder`, `removeOrder` y `deleteHistoryOrder`. Todas las mutaciones usan
`.select()` para detectar el caso de 0 filas afectadas.

**Acceptance criteria:**
- [ ] `useVendorOrders` consulta con `.eq('seller_id', user.id)` y `addOrder`
      inyecta el `seller_id` de la sesión.
- [ ] `useAdminOrders` consulta sin filtro de vendedor.
- [ ] `printOrder` lleva `.eq('printed', false)`; `cancelOrder` lleva las tres
      guardas; ambas devuelven un resultado distinguible cuando afectan 0 filas.
- [ ] `useOrders.js` ya no existe.

**Verification:**
- [ ] `npx vitest run src/hooks/` (casos 4, 5, 6, 7)
- [ ] `npm run build`

**Dependencies:** Task 1, Task 5

**Files likely touched:**
- `src/hooks/useOrdersQuery.js` (+ test)
- `src/hooks/useVendorOrders.js` (+ test)
- `src/hooks/useAdminOrders.js` (+ test)
- `src/hooks/useOrders.js` (eliminado)

**Estimated scope:** M

---

## Task 9: `Header` con tabs por prop

**Description:** Hoy `Header` hardcodea las tres pestañas. Vendedor y admin
tienen juegos distintos, así que las recibe como dato.

**Acceptance criteria:**
- [ ] `Header` recibe un array de tabs y el usuario, y no sabe qué rol es cuál.
- [ ] El contador rojo sigue funcionando y cuenta lo que le pasen.

**Verification:**
- [ ] `npm run build`
- [ ] Manual: la barra se ve igual que antes.

**Dependencies:** Task 7

**Files likely touched:**
- `src/components/layout/Header.jsx`
- `src/App.jsx`

**Estimated scope:** S

---

## Task 10: `VendorApp`

**Description:** Tres pestañas: Hacer pedido, Mis pendientes, Mi historial.
Pendientes en modo lectura con botón Cancelar. Historial de solo lectura, sin
Reimprimir y sin tacho. `PendingOrders.jsx` se reemplaza por
`VendorPendingList.jsx`.

**Acceptance criteria:**
- [ ] Ningún botón Imprimir ni Reimprimir en ninguna de las tres pestañas.
- [ ] Solo aparecen los pedidos propios.
- [ ] `CartBar` no se modifica.

**Verification:**
- [ ] `npx vitest run src/apps/VendorApp.test.jsx` (casos 9, 12)
- [ ] `npm run build`
- [ ] Manual: entrar como Eduardo y como Carlos, verificar que no se ven entre sí.

**Dependencies:** Task 8, Task 9

**Files likely touched:**
- `src/apps/VendorApp.jsx` (+ test)
- `src/components/orders/VendorPendingList.jsx`
- `src/components/orders/PendingOrders.jsx` (eliminado)
- `src/App.jsx`

**Estimated scope:** M

---

## Task 11: `AdminApp` y cola de impresión

**Description:** Dos pestañas: Cola de impresión e Historial. La cola es
cronológica, más viejo arriba, con badge de vendedor y chips de filtro
`Todos · Eduardo · Carlos`. El historial conserva Reimprimir y el tacho.

**Acceptance criteria:**
- [ ] No existe la pestaña "Hacer pedido".
- [ ] La cola muestra pedidos de ambos vendedores en orden cronológico con badge.
- [ ] Los chips filtran sin recargar.
- [ ] Imprimir genera el PDF, abre el diálogo y manda el pedido al historial.

**Verification:**
- [ ] `npx vitest run src/apps/AdminApp.test.jsx` (caso 10)
- [ ] `npm run build`
- [ ] Manual: entrar como admin, imprimir un pedido de cada vendedor.

**Dependencies:** Task 8, Task 9, Task 3

**Files likely touched:**
- `src/apps/AdminApp.jsx` (+ test)
- `src/components/orders/PrintQueue.jsx`
- `src/components/orders/OrderHistory.jsx`
- `src/App.jsx`

**Estimated scope:** M

---

### Checkpoint C — Roles

- [ ] `npm test` verde
- [ ] Eduardo no ve ni un pedido de Carlos, y viceversa
- [ ] Ninguno de los dos tiene Imprimir ni Reimprimir en ninguna pantalla
- [ ] El admin ve los de ambos e imprime
- [ ] Revisar con el humano antes de seguir

---

### Fase 4 — Cierre

## Task 12: Errores visibles

**Description:** Hoy un fallo de Supabase hace `console.error` y la fila
desaparece del estado optimista; el vendedor ve esfumarse su pedido sin
explicación. Se agrega un mensaje visible con opción de reintentar en enviar,
cancelar e imprimir, y se usan los resultados vacíos de la Task 8 para los casos
de carrera.

**Acceptance criteria:**
- [ ] Enviar un pedido que falla muestra el error y ofrece reintentar.
- [ ] Cancelar algo ya impreso muestra "ya fue impreso, hablá con administración".
- [ ] Imprimir algo ya cancelado avisa en vez de fallar en silencio.

**Verification:**
- [ ] `npm test`
- [ ] Manual: cortar la red y enviar un pedido; debe avisar, no desaparecer.

**Dependencies:** Task 10, Task 11

**Files likely touched:**
- `src/apps/VendorApp.jsx`
- `src/components/orders/VendorPendingList.jsx`
- `src/components/orders/PrintQueue.jsx`

**Estimated scope:** M

---

## Task 13: Vendedor en Telegram y en el comprobante

**Description:** El aviso de Telegram y el PDF suman el nombre del vendedor,
resuelto desde `USERS` con fallback al slug crudo si el usuario ya no está en el
config.

**Acceptance criteria:**
- [ ] El mensaje de Telegram incluye `👤 Vendedor: <nombre>`.
- [ ] `PrintableOrder` muestra el vendedor.
- [ ] Un `seller_id` desconocido muestra el slug en vez de romper.

**Verification:**
- [ ] `npm test`
- [ ] Manual: enviar un pedido y verificar el mensaje que llega a Telegram.

**Dependencies:** Task 8

**Files likely touched:**
- `src/hooks/useVendorOrders.js`
- `src/components/orders/PrintableOrder.jsx`

**Estimated scope:** S

---

## Task 14: `vercel.json`

**Description:** Apagar los preview deploys de `dev`, porque una preview heredaría
las variables de entorno de producción y pegaría contra la base real.

**Acceptance criteria:**
- [ ] `vercel.json` existe con `{ "git": { "deploymentEnabled": { "dev": false } } }`.

**Verification:**
- [ ] Manual: pushear `dev` y confirmar en Vercel que no se generó deploy.

**Dependencies:** Ninguna

**Files likely touched:**
- `vercel.json`

**Estimated scope:** XS — **hacer antes del primer push de `dev`.**

---

### Checkpoint D — Listo para PR

- [ ] Los 13 casos del spec pasan
- [ ] `npm run build` y `npm run lint` limpios
- [ ] Recorrido manual completo con los tres usuarios
- [ ] Los 11 criterios de éxito del spec verificados
- [ ] PR de `dev` a `main` abierto

---

## Después del merge

El merge dispara el deploy. Recién ahí:

1. Repetir `UPDATE orders SET seller_id = 'eduardo' WHERE seller_id IS NULL;`
   para barrer lo que haya entrado entre el paso 2 y el deploy.
2. `ALTER TABLE orders ALTER COLUMN seller_id SET NOT NULL;`

Puede esperar al día siguiente sin consecuencias.

---

## Risks and Mitigations

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El mock de Supabase no refleja la API real: tests verdes, app rota | Alto | Task 1 primero. El mock afirma sobre la cadena de llamadas, no sobre datos inventados. Todo checkpoint incluye prueba manual contra la base real. |
| Unificar los PDF cambia cómo se ve el comprobante | Medio | Task 3 exige comparar el PDF antes y después del mismo pedido. Se conserva la implementación de `PendingOrders`, que es la que ya está en uso diario. |
| `npm install` de las deps de test rompe la resolución actual de `html2canvas`/`jspdf` | Medio | Task 2 los declara directos *antes* de instalar nada nuevo. |
| La migración corre sobre producción | Medio | Pasos 1–2 son aditivos y reversibles con `DROP COLUMN`. El `NOT NULL` queda para después del merge. |
| Se pushea `dev` sin `vercel.json` y Vercel levanta una preview contra la base real | Medio | Task 14 marcada como "antes del primer push". |
| Alguien pushea a `main` por costumbre y deploya a medias | Alto | El hook `guard-protected-branch` no bloquea push a main. Mitigación real: no pushear main hasta el PR; está en Boundaries del spec. |
| El recorrido manual crea pedidos reales | Bajo | Nombres de cliente obviamente falsos, borrados al terminar. Los 13 tests no tocan la base. |

---

## Parallelization

Casi todo es secuencial: es una reescritura del shell de la app sobre una base
compartida.

- **Se pueden hacer en paralelo:** Task 2, Task 5 y Task 14 no dependen de nada
  ni entre sí.
- **Task 3 y Task 4** son independientes entre sí una vez lista la Task 1.
- **Task 10 y Task 11** comparten los hooks de la Task 8 pero no se tocan entre
  ellas.
- **Todo lo demás es cadena.**

---

## Open Questions

Ninguna. El spec cerró las suyas el 2026-08-07.

Dos tareas las ejecuta el humano, no el agente: la **Task 5** (SQL en el
dashboard) y los **dos pasos posteriores al merge**.
