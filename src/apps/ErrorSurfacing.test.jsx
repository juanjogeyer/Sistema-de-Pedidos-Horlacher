import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
const admin = { id: 'admin', name: 'Admin', role: 'admin' };

const pendiente = {
  id: 'e1',
  name: 'Kiosco de Eduardo',
  billing: '9 + IVA',
  express: 'TransFer',
  date: '2026-08-07T10:00:00Z',
  printed: false,
  seller_id: 'eduardo',
  cart: [{ code: '0007', name: 'Bolita crocante', quantity: 2 }],
};

const noop = () => {};

beforeEach(() => {
  supabase.__reset();
  supabase.__seed([pendiente]);
});

describe('errores visibles', () => {
  it('cancelar algo que el admin ya imprimio avisa al vendedor', async () => {
    const user = userEvent.setup();
    render(<VendorApp user={eduardo} onLogout={noop} />);

    await user.click(screen.getByRole('button', { name: /Mis pendientes/ }));
    await screen.findByText('Kiosco de Eduardo');

    // Cero filas afectadas: la guarda .eq('printed', false) no matcheo.
    supabase.__queueResult({ data: [] });
    await user.click(screen.getByRole('button', { name: /Cancelar/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/ya fue impreso/i);
  });

  it('el aviso se puede cerrar', async () => {
    const user = userEvent.setup();
    render(<VendorApp user={eduardo} onLogout={noop} />);

    await user.click(screen.getByRole('button', { name: /Mis pendientes/ }));
    await screen.findByText('Kiosco de Eduardo');
    supabase.__queueResult({ data: [] });
    await user.click(screen.getByRole('button', { name: /Cancelar/ }));
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('un fallo de conexion al cancelar ofrece reintentar', async () => {
    const user = userEvent.setup();
    render(<VendorApp user={eduardo} onLogout={noop} />);

    await user.click(screen.getByRole('button', { name: /Mis pendientes/ }));
    await screen.findByText('Kiosco de Eduardo');

    supabase.__queueResult({ data: null, error: { message: 'sin conexion' } });
    await user.click(screen.getByRole('button', { name: /Cancelar/ }));

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent(/probá de nuevo/i);
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('borrar un pendiente que ya no esta avisa al admin', async () => {
    const user = userEvent.setup();
    render(<AdminApp user={admin} onLogout={noop} />);
    await screen.findByText('Kiosco de Eduardo');

    supabase.__queueResult({ data: null, error: { message: 'sin conexion' } });
    await user.click(screen.getByRole('button', { name: 'Eliminar pedido sin imprimir' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo eliminar/i);
  });
});
