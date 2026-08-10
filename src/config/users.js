// Quien puede entrar y con que rol. Unica fuente de verdad.
// Agregar o sacar a alguien = editar este array, rebuild y subir.
//
// El PIN no es seguridad: viaja en el bundle como todo el resto del codigo.
// Frena el "me logueo como el otro" casual, nada mas. El modelo de amenaza
// completo esta en docs/superpowers/specs/2026-08-07-multi-vendedor-design.md
//
// `id` es lo que se guarda en la base (orders.seller_id) y no hay que cambiarlo:
// es lo que ata cada pedido a su vendedor. `name` es solo para mostrar, asi que
// se puede renombrar a alguien sin partirle el historial.

export const ROLES = {
  VENDEDOR: 'vendedor',
  ADMIN: 'admin',
};

export const USERS = [
  { id: 'eduardo', name: 'Eduardo Horlacher', role: ROLES.VENDEDOR, pin: '002' },
  { id: 'carlos', name: 'Carlos Riera', role: ROLES.VENDEDOR, pin: '003' },
  { id: 'admin', name: 'Admin', role: ROLES.ADMIN, pin: '001' },
];

export const PIN_LENGTH = 3;

/**
 * Nombre para mostrar de un `seller_id`.
 * Si ese vendedor ya no esta en la lista devuelve el slug crudo, para que los
 * pedidos viejos sigan siendo legibles en vez de aparecer en blanco.
 */
export function sellerName(sellerId) {
  return USERS.find((user) => user.id === sellerId)?.name ?? sellerId;
}

/**
 * Primer nombre, para el encabezado. Cada uno ve su propia pantalla, asi que el
 * apellido no desambigua nada y en un celular angosto pelea lugar con el logo.
 */
export function firstName(fullName) {
  return String(fullName ?? '').trim().split(/\s+/)[0] ?? '';
}
