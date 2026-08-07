# TODO: Multi-vendedor con roles y cola de impresión

Plan completo con criterios de aceptación: [`tasks/plan.md`](plan.md)
Spec: [`docs/superpowers/specs/2026-08-07-multi-vendedor-design.md`](../docs/superpowers/specs/2026-08-07-multi-vendedor-design.md)

Rama `dev`. No pushear `main`: cada push a `main` redeploya producción.

---

## Fase 1 — Base, sin cambio de comportamiento

- [ ] **Task 1** · Infraestructura de testing (vitest + RTL + jsdom + mock de Supabase) · M
- [ ] **Task 2** · Corregir dependencias declaradas en `package.json` · XS
- [ ] **Task 3** · Extraer `useOrderPrinting`, unificar los dos caminos de PDF · M · dep: 1, 2
- [ ] **Task 4** · Extraer `OrderCard` · M · dep: 1

### Checkpoint A
- [ ] `npm test` verde
- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin warnings
- [ ] La app se comporta **exactamente** igual que antes de empezar
- [ ] Revisado con el humano

---

## Fase 2 — Identidad

- [ ] **Task 5** · Migración pasos 1–2 (columna nullable + backfill) · XS · **la corre el humano**
- [ ] **Task 6** · `config/users.js` + `useAuth` · M · dep: 1
- [ ] **Task 7** · Pantalla de Login y gate de sesión · M · dep: 6

### Checkpoint B
- [ ] `npm test` verde
- [ ] Los tres usuarios entran con su PIN
- [ ] Detrás del login la app funciona igual que hoy
- [ ] Revisado con el humano

---

## Fase 3 — Separación por rol

- [ ] **Task 8** · Partir `useOrders` en `useOrdersQuery` / `useVendorOrders` / `useAdminOrders` · M · dep: 1, 5
- [ ] **Task 9** · `Header` con tabs por prop · S · dep: 7
- [ ] **Task 10** · `VendorApp` + `VendorPendingList` · M · dep: 8, 9
- [ ] **Task 11** · `AdminApp` + `PrintQueue` · M · dep: 3, 8, 9

### Checkpoint C
- [ ] `npm test` verde
- [ ] Eduardo no ve ni un pedido de Carlos, y viceversa
- [ ] Ninguno de los dos tiene Imprimir ni Reimprimir en ninguna pantalla
- [ ] El admin ve los de ambos e imprime
- [ ] Revisado con el humano

---

## Fase 4 — Cierre

- [ ] **Task 12** · Errores visibles en enviar / cancelar / imprimir · M · dep: 10, 11
- [ ] **Task 13** · Vendedor en Telegram y en el comprobante · S · dep: 8
- [ ] **Task 14** · `vercel.json` · XS · **antes del primer push de `dev`**

### Checkpoint D — Listo para PR
- [ ] Los 13 casos de test del spec pasan
- [ ] `npm run build` y `npm run lint` limpios
- [ ] Recorrido manual con los tres usuarios
- [ ] Los 11 criterios de éxito del spec verificados
- [ ] PR de `dev` a `main` abierto

---

## Después del merge · lo hace el humano

- [ ] `UPDATE orders SET seller_id = 'eduardo' WHERE seller_id IS NULL;`
- [ ] `ALTER TABLE orders ALTER COLUMN seller_id SET NOT NULL;`
