import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/supabase', async () => {
  const { createSupabaseMock } = await vi.importActual('../test/supabaseMock');
  return { supabase: createSupabaseMock() };
});
vi.mock('../lib/telegram', () => ({ notificarPedido: vi.fn() }));

import { supabase } from '../lib/supabase';
import { VendorApp } from './VendorApp';
import { AdminApp } from './AdminApp';

const eduardo = { id: 'eduardo', name: 'Eduardo Horlacher', role: 'vendedor' };
const carlos = { id: 'carlos', name: 'Carlos Riera', role: 'vendedor' };
const admin = { id: 'admin', name: 'Admin', role: 'admin' };

const orden = (over) => ({
  billing: '9 + IVA',
  express: 'TransFer',
  date: '2026-08-07T10:00:00Z',
  printed: false,
  cart: [{ code: '0007', name: 'Bolita crocante', quantity: 2 }],
  ...over,
});

// Un pedido de cada vendedor, uno pendiente y uno impreso por cabeza.
const TABLA = [
  orden({ id: 'e1', name: 'Kiosco de Eduardo', seller_id: 'eduardo', printed: false }),
  orden({ id: 'e2', name: 'Almacen de Eduardo', seller_id: 'eduardo', printed: true }),
  orden({ id: 'c1', name: 'Kiosco de Carlos', seller_id: 'carlos', printed: false }),
  orden({ id: 'c2', name: 'Almacen de Carlos', seller_id: 'carlos', printed: true }),
];

beforeEach(() => {
  supabase.__reset();
  supabase.__seed(TABLA);
});

const noop = () => {};

describe('VendorApp', () => {
  // Caso 12 del spec: es la feature entera escrita como test.
  it('Eduardo ve sus pendientes y ninguno de Carlos', async () => {
    const user = userEvent.setup();
    render(<VendorApp user={eduardo} onLogout={noop} />);

    await user.click(screen.getByRole('button', { name: /Mis pendientes/ }));

    expect(await screen.findByText('Kiosco de Eduardo')).toBeInTheDocument();
    expect(screen.queryByText('Kiosco de Carlos')).not.toBeInTheDocument();
  });

  it('Carlos ve los suyos y ninguno de Eduardo', async () => {
    const user = userEvent.setup();
    render(<VendorApp user={carlos} onLogout={noop} />);

    await user.click(screen.getByRole('button', { name: /Mis pendientes/ }));

    expect(await screen.findByText('Kiosco de Carlos')).toBeInTheDocument();
    expect(screen.queryByText('Kiosco de Eduardo')).not.toBeInTheDocument();
  });

  it('el historial tambien esta separado', async () => {
    const user = userEvent.setup();
    render(<VendorApp user={eduardo} onLogout={noop} />);

    await user.click(screen.getByRole('button', { name: 'Mi historial' }));

    expect(await screen.findByText('Almacen de Eduardo')).toBeInTheDocument();
    expect(screen.queryByText('Almacen de Carlos')).not.toBeInTheDocument();
  });

  it('tiene las tres pestanas del vendedor', () => {
    render(<VendorApp user={eduardo} onLogout={noop} />);

    expect(screen.getByRole('button', { name: 'Hacer pedido' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mis pendientes/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mi historial' })).toBeInTheDocument();
  });

  // Caso 9 del spec: no que el boton este oculto, que no exista.
  it('no tiene Imprimir ni Reimprimir en ninguna de sus pantallas', async () => {
    const user = userEvent.setup();
    render(<VendorApp user={eduardo} onLogout={noop} />);

    for (const tab of ['Hacer pedido', 'Mis pendientes', 'Mi historial']) {
      await user.click(screen.getByRole('button', { name: new RegExp(tab) }));
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /imprimir/i })).not.toBeInTheDocument();
      });
    }
  });

  it('puede cancelar un pendiente propio', async () => {
    const user = userEvent.setup();
    render(<VendorApp user={eduardo} onLogout={noop} />);

    await user.click(screen.getByRole('button', { name: /Mis pendientes/ }));
    await screen.findByText('Kiosco de Eduardo');

    expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument();
  });

  it('su historial es de solo lectura', async () => {
    const user = userEvent.setup();
    render(<VendorApp user={eduardo} onLogout={noop} />);

    await user.click(screen.getByRole('button', { name: 'Mi historial' }));
    await screen.findByText('Almacen de Eduardo');

    expect(screen.queryByRole('button', { name: /Cancelar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Eliminar/ })).not.toBeInTheDocument();
  });
});

describe('AdminApp', () => {
  // Caso 10 del spec.
  it('tiene dos pestanas y no puede cargar pedidos', () => {
    render(<AdminApp user={admin} onLogout={noop} />);

    expect(screen.getByRole('button', { name: /Cola de impresión/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Historial' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hacer pedido' })).not.toBeInTheDocument();
  });

  it('ve los pendientes de los dos vendedores juntos', async () => {
    render(<AdminApp user={admin} onLogout={noop} />);

    expect(await screen.findByText('Kiosco de Eduardo')).toBeInTheDocument();
    expect(screen.getByText('Kiosco de Carlos')).toBeInTheDocument();
  });

  it('etiqueta cada pedido con su vendedor, con nombre completo', async () => {
    render(<AdminApp user={admin} onLogout={noop} />);
    await screen.findByText('Kiosco de Eduardo');

    // Los chips del filtro usan nombre de pila; los badges, el nombre completo.
    expect(screen.getByText('Eduardo Horlacher')).toBeInTheDocument();
    expect(screen.getByText('Carlos Riera')).toBeInTheDocument();
  });

  it('puede imprimir', async () => {
    render(<AdminApp user={admin} onLogout={noop} />);
    await screen.findByText('Kiosco de Eduardo');

    expect(screen.getAllByRole('button', { name: 'Imprimir' })).toHaveLength(2);
  });

  it('los chips filtran por vendedor sin recargar', async () => {
    const user = userEvent.setup();
    render(<AdminApp user={admin} onLogout={noop} />);
    await screen.findByText('Kiosco de Eduardo');

    await user.click(screen.getByRole('button', { name: 'Carlos' }));

    expect(screen.queryByText('Kiosco de Eduardo')).not.toBeInTheDocument();
    expect(screen.getByText('Kiosco de Carlos')).toBeInTheDocument();
  });

  it('ve el historial de los dos y puede reimprimir', async () => {
    const user = userEvent.setup();
    render(<AdminApp user={admin} onLogout={noop} />);

    await user.click(screen.getByRole('button', { name: 'Historial' }));

    expect(await screen.findByText('Almacen de Eduardo')).toBeInTheDocument();
    expect(screen.getByText('Almacen de Carlos')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Reimprimir' })).toHaveLength(2);
  });
});
