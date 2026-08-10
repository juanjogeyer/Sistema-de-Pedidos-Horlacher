# TODO: Multi-vendedor con roles y cola de impresión

Plan completo con criterios de aceptación: [`tasks/plan.md`](plan.md)
Spec: [`docs/superpowers/specs/2026-08-07-multi-vendedor-design.md`](../docs/superpowers/specs/2026-08-07-multi-vendedor-design.md)

**Estado: las 14 tareas hechas. Listo para el PR de `dev` a `main`.**

---

## Fase 1 — Base, sin cambio de comportamiento

- [x] **Task 1** · Infraestructura de testing (vitest + RTL + jsdom + mock de Supabase)
- [x] **Task 2** · Corregir dependencias declaradas en `package.json`
- [x] **Task 3** · Extraer `useOrderPrinting`, unificar los dos caminos de PDF
- [x] **Task 4** · Extraer `OrderCard`

### Checkpoint A — verificado por el dueño
- [x] `npm test`, `npm run build` y `npm run lint` en verde
- [x] La app se comporta igual que antes de empezar

**Fuera de plan, aprobado sobre la marcha:** `npm run lint` no corría (eslint nunca
estuvo instalado); se instaló y configuró, y arregló tres hallazgos reales.
`dist/` se destrackeó: cada build reescribía `dist/index.html` apuntando a
bundles que no estaban en el repo.

---

## Fase 2 — Identidad

- [x] **Task 5** · Migración pasos 1–2 · **corrida por el dueño**, `count: 0`
- [x] **Task 6** · `config/users.js` + `useAuth`
- [x] **Task 7** · Pantalla de Login y gate de sesión

### Checkpoint B — verificado por el dueño
- [x] Los tres usuarios entran con su PIN, la sesión sobrevive a recargar
- [x] Detrás del login la app funciona igual que antes

**Pedidos del dueño en este punto:** `APP_NAME` pasó a "Pedidos Dulxelitos", el
encabezado saluda al vendedor por su nombre de pila, y el logo se sumó al login.

---

## Fase 3 — Separación por rol

- [x] **Task 8** · `useOrdersQuery` / `useVendorOrders` / `useAdminOrders`
- [x] **Task 9** · `Header` con tabs por prop
- [x] **Task 10** · `VendorApp`
- [x] **Task 11** · `AdminApp` + `PrintQueue`

### Checkpoint C — verificado por el dueño
- [x] Eduardo no ve ni un pedido de Carlos, y viceversa
- [x] Ninguno tiene Imprimir ni Reimprimir en ninguna pantalla
- [x] El admin ve los de ambos, con badge de vendedor, e imprime

---

## Fase 4 — Cierre

- [x] **Task 12** · Errores visibles en enviar / cancelar / imprimir
- [x] **Task 13** · Vendedor en Telegram y en el comprobante
- [x] **Task 14** · `vercel.json` (se hizo primero, antes del primer push)

### Checkpoint D
- [x] 111 tests pasan
- [x] `npm run build` y `npm run lint` limpios
- [ ] PR de `dev` a `main` abierto
- [ ] Recorrido manual final con los tres usuarios

---

## Después del merge · lo hace el dueño

El merge dispara el deploy de Vercel. Recién ahí, en el editor SQL de Supabase:

- [ ] `UPDATE orders SET seller_id = 'eduardo' WHERE seller_id IS NULL;`
- [ ] `ALTER TABLE orders ALTER COLUMN seller_id SET NOT NULL;`

Puede esperar al día siguiente sin consecuencias. El detalle está en
[`supabase/migrations/001-seller-id.sql`](../supabase/migrations/001-seller-id.sql).

---

## Anotado para después, fuera de alcance

- El favicon sigue apaisado: el logo es casi 2:1 y la pestaña lo achica a algo
  ilegible. Necesita un ícono cuadrado hecho a propósito, que es una decisión de
  diseño.
- La tabla `orders` sigue siendo legible por cualquiera que tenga la anon key.
  El camino, si algún día se quiere separación real, es Supabase Auth + RLS
  sobre `seller_id`, que ya es la columna correcta para esas policies.
