# Spec: Multi-vendedor con roles y cola de impresión

- **Fecha:** 2026-08-07
- **Estado:** aprobado. Sin preguntas abiertas.
- **Proyecto:** Sistema de Pedidos Horlacher

---

## Objetivo

El sistema lo usaba un solo vendedor. Ahora son dos, más una persona en
administración que centraliza la impresión.

Hay que:

1. Identificar quién carga cada pedido.
2. Que cada vendedor vea solo los pedidos propios.
3. Que un rol admin vea los pedidos de ambos y sea el único que imprime.

**Éxito** = los dos vendedores trabajan en paralelo sin verse los pedidos entre
sí, y el admin despacha una única cola ordenada sin riesgo de imprimir dos veces
lo mismo ni de saltear un pedido.

---

## Punto de partida

| Cosa | Estado hoy |
|---|---|
| Autenticación | Ninguna. Se entra a la URL y se carga. |
| Acceso a datos | `supabase-js` desde el browser con la anon key. |
| Tabla `orders` | `id`, `date`, `printed`, `cart` (jsonb), `name`, `billing`, `express`, `notes`. Sin dueño. |
| Schema | Vive solo en el dashboard de Supabase. No hay migraciones en el repo. |
| Impresión | La hace el vendedor desde `PendingOrders.jsx`; marca `printed=true` y el pedido pasa a Historial. |
| Tests | No hay. Ni framework ni script. |
| Deploy | Vercel conectado a GitHub. Todo push a `main` redeploya producción. |

### Deuda encontrada al explorar

**Dos implementaciones de PDF divergentes.** El mismo `PrintableOrder` se
imprime por dos caminos distintos:

| | Librería | Ajuste a A4 |
|---|---|---|
| `PendingOrders` (Imprimir) | `html2canvas` + `jsPDF` a mano | sí, hace zoom para que entre en una hoja |
| `OrderHistory` (Reimprimir) | `html2pdf.js`, que envuelve a esas mismas dos | **no** |

El del historial no tiene el ajuste, así que un pedido largo reimpreso se parte
en dos hojas. `useOrderPrinting.js` unifica ambos y se queda con la versión de
`PendingOrders`, que es la correcta.

**Dependencias mal declaradas.** `PendingOrders.jsx` importa `html2canvas` y
`jspdf`, pero ninguno de los dos está en `package.json`: resuelven porque son
dependencias transitivas de `html2pdf.js`. Funciona por accidente — un
`npm update` que cambie las dependencias internas de `html2pdf.js` rompe la
impresión sin que nadie toque una línea del proyecto.

Como este cambio mueve ese código a `useOrderPrinting.js` y le agrega tests que
lo importan, se corrige en el camino:

- Declarar `html2canvas` y `jspdf` como dependencias directas.
- Sacar `html2pdf.js`, que queda sin uso una vez unificado.
- Sacar `@vercel/blob` y `pdfkit`, declarados y sin un solo import en el
  código — restos de la implementación anterior de PDF.

---

## Modelo de amenaza (decidido)

La separación entre vendedores es **a nivel de pantalla, no de servidor**.

La app filtra por vendedor y muestra a cada uno lo suyo. Esto evita confusión y
pedidos cruzados por error. **No** evita que alguien con conocimiento técnico vea
todo: la anon key viaja en el bundle, el `seller_id` lo manda el cliente, y la
sesión vive en `localStorage`, que es editable desde devtools.

Esta limitación es una decisión explícita del dueño del producto, no un descuido.
La alternativa —Supabase Auth con RLS— se evaluó y se descartó por costo.

Consecuencia registrada: **hoy, sin este cambio, la tabla `orders` ya es legible
por cualquiera que tenga la anon key.** Este cambio no lo empeora ni lo arregla.
Si en algún momento se quiere separación real, el camino es Supabase Auth + RLS
por `seller_id`, y el `seller_id` de este diseño es exactamente la columna sobre
la que se escribirían esas policies.

---

## Asunciones

1. Los pedidos que ya están en la base los cargó **Eduardo Horlacher** y se le
   asignan a él. *(Confirmado por el dueño del producto el 2026-08-07.)*
2. Los tres usuarios son estables. Sumar un cuarto implica editar código,
   rebuild y subir — y eso es aceptable.
3. El admin no carga pedidos. Si algún día lo necesita, entra como vendedor.
4. Un solo chat de Telegram recibe los avisos de ambos vendedores.

---

## Usuarios y roles

`src/config/users.js` es la única fuente de verdad:

```js
export const USERS = [
  { id: 'eduardo', name: 'Eduardo Horlacher', role: 'vendedor', pin: '002' },
  { id: 'carlos',  name: 'Carlos Riera',      role: 'vendedor', pin: '003' },
  { id: 'admin',   name: 'Admin',             role: 'admin',    pin: '001' },
];
```

`id` es un slug estable y es lo que se guarda en la base. `name` es solo para
mostrar. Están separados para que renombrar a alguien no parta su historial.

Los PIN son de 3 dígitos. Se cambian editando esa línea.

### Permisos

| Acción | vendedor | admin |
|---|---|---|
| Cargar pedido | sí | no |
| Ver pedidos pendientes | solo los propios | todos |
| Cancelar pendiente | solo propio y no impreso | cualquiera |
| Imprimir | **no** | sí |
| Ver historial | solo el propio | todo |
| Reimprimir desde historial | **no** | sí |
| Borrar del historial | no | sí |

El historial del vendedor es de solo lectura: sin Reimprimir y sin tacho.
Reimprimir no cambia nada en la base, pero saca papel, y el papel es lo que va
al expreso. Si el vendedor puede sacar una copia, vuelve por la puerta de atrás
el envío duplicado que este diseño busca evitar.

---

## Modelo de datos

Una columna nueva en `orders`. Sin tablas nuevas, sin foreign keys.

```sql
-- supabase/migrations/001-seller-id.sql
ALTER TABLE orders ADD COLUMN seller_id text;
UPDATE orders SET seller_id = 'eduardo' WHERE seller_id IS NULL;
ALTER TABLE orders ALTER COLUMN seller_id SET NOT NULL;
```

El archivo queda en el repo como registro de qué se le hizo a la base. Nadie lo
ejecuta automáticamente: el SQL se corre a mano en el editor del dashboard.

### Orden de la migración

Importa, porque mientras se toca la base hay código viejo corriendo en los
celulares. Y como Vercel deploya solo al mergear, **el merge del PR es el paso
3**: no hay forma de deployar antes ni después, así que la secuencia se ordena
alrededor de ese momento.

1. `ALTER TABLE orders ADD COLUMN seller_id text;` — nullable. El código viejo
   sigue insertando sin problema.
2. `UPDATE orders SET seller_id = 'eduardo' WHERE seller_id IS NULL;`
3. **Merge del PR `dev` → `main`.** Vercel deploya. Desde acá todo pedido nuevo
   trae `seller_id`.
4. Repetir el `UPDATE` del paso 2, para barrer lo que haya entrado entre 2 y 3.
5. `ALTER TABLE orders ALTER COLUMN seller_id SET NOT NULL;`

Poner el `NOT NULL` antes del merge hace fallar todo envío desde una pestaña que
todavía tenga el código viejo. Los pasos 1 y 2 pueden correrse tranquilos días
antes: agregar una columna nullable no rompe nada. Los pasos 4 y 5 pueden
esperar al día siguiente.

## Flujo de trabajo y deploy

El cambio se desarrolla en la rama `dev` y llega a producción por un PR a
`main`. Nada toca producción hasta ese merge.

**Preview deploys apagados.** Vercel genera una URL por rama, y esa preview
usaría las mismas variables de entorno que producción — o sea, la base real. Se
desactivan para `dev` con un `vercel.json` en el repo:

```json
{ "git": { "deploymentEnabled": { "dev": false } } }
```

En el repo y no en el dashboard a propósito: así la regla es visible, revisable
en el PR, y sobrevive a que alguien toque la configuración.

**Testing.** Los 13 tests automatizados mockean el cliente de Supabase y no
tocan ninguna base. El recorrido manual se hace con `npm run dev`, que apunta a
donde diga `.env`. Hoy eso es producción: el recorrido manual se hace con
nombres de cliente obviamente falsos, y se borran al terminar. Si en algún
momento se quiere una base de juguete, `.env.local` ya está en `.gitignore` y
pisa a `.env` sin tocar nada más.

---

## Sesión

`src/hooks/useAuth.js` expone un context con `{ user, login(id, pin), logout() }`.

- `login` valida el PIN contra `USERS` y guarda **solo el `id`** en
  `localStorage`, clave `pedidos.session`. El PIN nunca se persiste.
- Al arrancar se resuelve `id` → usuario contra `USERS`. Si no matchea (el
  usuario ya no está en el config), se limpia la sesión y se va a Login.
- Sin vencimiento. Se sale con el botón "Salir" del Header.
- Todo acceso a `localStorage` va envuelto en try/catch: en modo privado se
  pierde la persistencia (pide PIN cada vez) pero la app no se cae.

Resolver contra el config en cada arranque —en lugar de guardar el objeto
usuario entero— hace que cambiarle el rol o el nombre a alguien tenga efecto con
solo recargar.

---

## Arquitectura

Dos árboles de componentes bajo un shell de sesión. Vendedor y admin no
comparten ninguna pantalla, así que no comparten código de vista.

```
App.jsx
├── (sin sesión)  → Login
├── role vendedor → VendorApp   tabs: Hacer pedido / Mis pendientes / Mi historial
└── role admin    → AdminApp    tabs: Cola de impresión / Historial
```

El botón Imprimir no existe en el árbol del vendedor. No está deshabilitado ni
oculto por un `if`: no está. Cuando la regla de negocio dice "esta persona no
puede hacer esto", el código que mejor la expresa es el que no lo contiene.

### Archivos

```
src/
  App.jsx                       ← reescrito: shell de sesión, despacha por rol
  apps/
    VendorApp.jsx               ← NUEVO
    AdminApp.jsx                ← NUEVO
  components/
    auth/Login.jsx              ← NUEVO
    layout/Header.jsx           ← recibe tabs por prop + usuario + Salir
    orders/
      OrderCard.jsx             ← NUEVO: tarjeta presentacional
      VendorPendingList.jsx     ← NUEVO
      PrintQueue.jsx            ← NUEVO
      PendingOrders.jsx         ← ELIMINADO (se parte en los dos de arriba)
      OrderHistory.jsx          ← usa OrderCard; pierde su copia de la lógica PDF
      PrintableOrder.jsx        ← suma línea de vendedor
  hooks/
    useAuth.js                  ← NUEVO
    useOrdersQuery.js           ← NUEVO
    useVendorOrders.js          ← NUEVO
    useAdminOrders.js           ← NUEVO
    useOrderPrinting.js         ← NUEVO
    useOrders.js                ← ELIMINADO (se parte en los tres de arriba)
  config/users.js               ← NUEVO
supabase/
  migrations/001-seller-id.sql  ← NUEVO
vercel.json                     ← NUEVO: apaga los preview deploys de dev
```

**Sin cambios:** `CartBar`, `ProductList`, `ProductCard`, `FilterBar`,
`useCart`, `useFilter`, `useLongPress`, `products.js`.

Que `CartBar` no cambie es deliberado: `addOrder` le inyecta el `seller_id`
desde la sesión, así que el formulario no se entera de que existen vendedores.

### Hooks de pedidos

`useOrders.js` hace hoy cinco cosas. Se parte en tres:

- **`useOrdersQuery(filter)`** — fetch, realtime, polling de 8s, split
  pendientes/historial. Sin mutaciones.
- **`useVendorOrders(user)`** — query filtrado por `seller_id`. Expone
  `addOrder` y `cancelOrder`.
- **`useAdminOrders()`** — query sin filtro. Expone `printOrder`, `removeOrder`
  y `deleteHistoryOrder`.

El árbol del vendedor nunca importa `useAdminOrders`.

### OrderCard

La tarjeta de pedido es idéntica en las tres listas (pendientes del vendedor,
cola del admin, historial). Se extrae a un componente presentacional puro:

```jsx
<OrderCard order={order} showSeller={bool} actions={<>…</>} />
```

`OrderCard` no sabe qué es un rol ni un permiso. Dibuja un pedido y pone abajo
los botones que le pasen. Las listas quedan en ~30 líneas: traer, mapear,
decidir botones. Agregar un campo al pedido se hace en un solo archivo.

### Cola de impresión

Lista cronológica, más viejo arriba, con badge de vendedor en cada tarjeta.
Arriba, chips de filtro `Todos · Eduardo · Carlos`.

Cronológico y no agrupado por vendedor a propósito: es una **cola**, y lo que el
admin necesita saber es qué entró primero. Agrupar por vendedor esconde que el
pedido de Carlos de las 9 quedó abajo del de Eduardo de las 11. Los chips cubren
el caso "hoy despacho solo lo de Carlos".

El contador rojo del Header cuenta todos los pendientes para el admin, y solo
los propios para el vendedor.

### Login

Pantalla única: los tres usuarios como botones grandes. Se toca uno y aparece un
teclado numérico de 3 casilleros. Valida al tercer dígito.

Sin campo de texto para el nombre — se usa en el celular con una mano.

PIN incorrecto: mensaje inline, se limpian los casilleros. Sin bloqueo ni
contador de intentos: un lockout no compra nada cuando el PIN está en el bundle,
y sí puede dejar afuera a un vendedor en la ruta.

---

## Carreras entre roles

Vendedor y admin miran las mismas filas al mismo tiempo. La ventana de
desincronización es de hasta 8 segundos (el polling), normalmente menos porque
el realtime avisa antes.

**El admin imprime algo que el vendedor acaba de cancelar.** Un `update` sobre
una fila inexistente no es error en Postgres: afecta 0 filas y devuelve OK. El
admin vería el PDF generado y el pedido desaparecer sin explicación. Se resuelve
pidiendo que devuelva lo que tocó:

```js
const { data } = await supabase.from('orders')
  .update({ printed: true }).eq('id', id).eq('printed', false).select();
if (!data?.length) { /* avisar: el pedido ya no está o ya fue impreso */ }
```

**El vendedor cancela algo que el admin acaba de imprimir.** `cancelOrder` lleva
las guardas en la propia query:

```js
.delete().eq('id', id).eq('seller_id', user.id).eq('printed', false).select()
```

No es seguridad —el cliente arma la query— pero convierte un bug de UI en un
no-op: si el botón aparece donde no debe, el DELETE no borra nada. Si vuelve
vacío, cartel de "ya fue impreso, hablá con administración".

---

## Manejo de errores

Hoy `addOrder` falla, hace `console.error`, y saca la fila del estado optimista.
El vendedor ve desaparecer su pedido sin saber por qué. Ya pasa hoy; con dos
vendedores y un admin esperando, deja de ser tolerable.

Se agrega un cartel de error visible en enviar pedido, cancelar e imprimir. No
es un sistema de notificaciones: es un mensaje rojo con la opción de reintentar.
Es el cambio más chico que convierte "se perdió" en "falló, probá de nuevo".

Se mantiene el patrón de update optimista con rollback que ya usa el código.

## Otros bordes

- **`seller_id` que no está en `USERS`** (se sacó un vendedor del config): el
  badge muestra el slug crudo en vez de romper. Los pedidos viejos siguen
  legibles.
- **Misma cuenta en dos dispositivos:** funciona, el realtime los sincroniza. No
  hay sesión única ni hace falta.

---

## Telegram

El mensaje suma una línea `👤 Vendedor: <nombre>`. El aviso ahora le llega al
admin, que es quien imprime, y necesita saber de quién es el pedido antes de
abrir la app.

---

## Testing

El proyecto no tiene tests hoy. Este cambio introduce la infraestructura.

**Dependencias nuevas (dev):** `vitest`, `@testing-library/react`,
`@testing-library/jest-dom`, `jsdom`.

**Setup:** bloque `test` en `vite.config.js` con entorno jsdom, un
`src/test/setup.js`, un mock del cliente de Supabase, y script `"test": "vitest"`
en `package.json`.

**Ubicación:** los tests van junto al archivo que prueban, como `*.test.js` /
`*.test.jsx`.

### Casos

**Lógica**

1. `useAuth` resuelve el id guardado contra `USERS`; id desconocido limpia la sesión.
2. `localStorage` que tira excepción no rompe la app.
3. PIN correcto entra, incorrecto no, valida a los 3 dígitos.
4. `useVendorOrders` consulta con `.eq('seller_id', user.id)`; `addOrder`
   inyecta el `seller_id` de la sesión.
5. `useAdminOrders` consulta sin filtro de vendedor.
6. `printOrder` incluye `.eq('printed', false)`; resultado vacío levanta el
   error visible.
7. `cancelOrder` incluye las tres guardas; resultado vacío levanta el error visible.

**Componentes**

8. `Login` muestra los tres usuarios; PIN mal → cartel y no entra; PIN bien → entra.
9. `VendorApp` tiene 3 tabs y ningún botón Imprimir ni Reimprimir en ninguna de
   ellas, incluido Mi historial.
10. `AdminApp` tiene 2 tabs y no tiene "Hacer pedido".
11. `OrderCard` muestra el badge de vendedor solo con `showSeller`.
12. Dados pedidos de Eduardo y de Carlos, la lista de Eduardo muestra solo los suyos.
13. `useOrderPrinting` es el único camino a PDF: ni `OrderHistory` ni
    `PrintQueue` importan `html2pdf`, `html2canvas` o `jspdf` directamente.

El caso 12 es la feature entera escrita como test: si alguien rompe el filtro
dentro de seis meses, ese test se pone rojo. Los casos 9 y 10 verifican la
decisión arquitectónica — no que el botón esté oculto, que no exista. El 13
evita que las dos implementaciones de PDF vuelvan a divergir.

---

## Comandos

```
Dev:      npm run dev
Build:    npm run build
Preview:  npm run preview
Lint:     npm run lint
Test:     npm test
```

---

## Estilo de código

Se sigue lo que ya hay. Componentes funcionales con export nombrado, hooks en
`src/hooks/` con prefijo `use`, Tailwind inline, sin CSS modules. Identificadores
en inglés, texto de interfaz y comentarios en español.

```jsx
export function OrderCard({ order, showSeller = false, actions = null }) {
  const totalItems = order.cart.reduce((sum, item) => sum + item.quantity, 0);
  ...
}
```

---

## Boundaries

**Siempre**

- Correr `npm test` y `npm run lint` antes de commitear.
- Mantener el patrón de update optimista con rollback.
- Toda query de pedidos filtra por `seller_id` cuando el rol es vendedor.

**Preguntar primero**

- Cambiar el schema de `orders` más allá de `seller_id`.
- Agregar dependencias fuera de las cuatro de testing listadas.
- Cambiar el aspecto del PDF. Unificar las dos implementaciones sí está en
  alcance; rediseñar `PrintableOrder` no.

**Nunca**

- Commitear PIN reales distintos a los del config, ni credenciales.
- Ejecutar el SQL de migración automáticamente desde la app.
- Borrar pedidos sin las guardas de rol y de `printed`.
- Pushear a `main`. Todo va por PR desde `dev`, porque un push a `main`
  redeploya producción al instante.

---

## Criterios de éxito

1. Eduardo entra con su PIN y ve solo sus pedidos, pendientes e historial.
2. Carlos entra con su PIN y no ve ni uno de los pedidos de Eduardo.
3. Ninguno de los dos tiene botón Imprimir ni Reimprimir en ninguna pantalla;
   su historial es de solo lectura.
4. El admin entra y ve los pendientes de ambos en una lista cronológica, con
   badge de quién lo cargó.
5. El admin imprime: se genera el PDF, se abre el diálogo, el pedido pasa al
   historial y desaparece de la cola.
6. El vendedor cancela un pendiente propio no impreso y desaparece de su lista y
   de la cola del admin dentro de 8 segundos.
7. El vendedor intenta cancelar algo ya impreso y recibe un mensaje claro.
8. El aviso de Telegram incluye el nombre del vendedor.
9. Los pedidos históricos aparecen atribuidos a Eduardo.
10. El admin reimprime desde el historial y el PDF entra en una sola hoja A4.
11. `npm test` pasa con los 13 casos.

---

## Fuera de alcance

- Supabase Auth y RLS.
- ABM de usuarios desde la app.
- Reportes o métricas por vendedor.
- Que el admin cargue pedidos.
- Cerrar el acceso público a la tabla `orders`.
- Recuperar un pedido borrado.

---

## Decisiones de alcance del PR

Todo va en un solo PR de `dev` a `main`, en commits separados para que el diff
se lea por partes.

La unificación de PDF y la corrección de dependencias no son un extra: son
prerequisito. `useOrderPrinting.js` es cómo el admin comparte una sola
implementación entre Cola de impresión y Reimprimir — sin unificar, `AdminApp`
nace con las dos copias divergentes adentro. Y declarar `html2canvas`/`jspdf`
hace falta para que los tests los importen sin depender de que `html2pdf.js`
siga arrastrándolos como dependencias transitivas.

Separarlo en dos PRs dejaría al primero tocando archivos que el segundo
reescribe.

---

## Preguntas abiertas

Ninguna. La atribución de los pedidos históricos a Eduardo Horlacher quedó
confirmada el 2026-08-07 y está registrada en Asunciones.

