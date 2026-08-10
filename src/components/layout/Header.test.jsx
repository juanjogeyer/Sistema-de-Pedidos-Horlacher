import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { firstName } from '../../config/users';

const eduardo = { id: 'eduardo', name: 'Eduardo Horlacher', role: 'vendedor' };
const admin = { id: 'admin', name: 'Admin', role: 'admin' };

const TABS_VENDEDOR = [
  { id: 'order', label: 'Hacer pedido' },
  { id: 'pending', label: 'Mis pendientes', badge: 0 },
  { id: 'history', label: 'Mi historial' },
];

function renderHeader(props = {}) {
  return render(
    <Header
      tabs={TABS_VENDEDOR}
      activeTab="order"
      onTabChange={() => {}}
      user={eduardo}
      onLogout={() => {}}
      {...props}
    />
  );
}

describe('Header', () => {
  it('saluda al vendedor por su nombre de pila', () => {
    renderHeader();

    expect(screen.getByRole('heading')).toHaveTextContent('Pedidos Eduardo');
  });

  it('no repite el nombre completo al lado del boton de salir', () => {
    renderHeader();

    expect(screen.queryByText('Eduardo Horlacher')).not.toBeInTheDocument();
  });

  it('sirve para un usuario sin apellido', () => {
    renderHeader({ user: admin });

    expect(screen.getByRole('heading')).toHaveTextContent('Pedidos Admin');
  });

  it('salir avisa a quien lo monto', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderHeader({ onLogout });

    await user.click(screen.getByRole('button', { name: 'Salir' }));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('dibuja las pestanas que le pasan, sin saber de roles', () => {
    renderHeader({
      tabs: [
        { id: 'queue', label: 'Cola de impresión' },
        { id: 'history', label: 'Historial' },
      ],
    });

    expect(screen.getByRole('button', { name: 'Cola de impresión' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hacer pedido' })).not.toBeInTheDocument();
  });

  it('muestra el badge solo si es mayor que cero', () => {
    const withBadge = (badge) => [{ id: 'pending', label: 'Mis pendientes', badge }];

    const { unmount } = renderHeader({ tabs: withBadge(3) });
    expect(screen.getByText('3')).toBeInTheDocument();
    unmount();

    renderHeader({ tabs: withBadge(0) });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('cambia de pestana', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    renderHeader({ onTabChange });

    await user.click(screen.getByRole('button', { name: 'Mi historial' }));

    expect(onTabChange).toHaveBeenCalledWith('history');
  });

  it('marca cual pestana esta activa', () => {
    renderHeader({ activeTab: 'pending' });

    expect(screen.getByRole('button', { name: 'Mis pendientes' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});

describe('firstName', () => {
  it('corta en el primer espacio', () => {
    expect(firstName('Eduardo Horlacher')).toBe('Eduardo');
  });

  it('deja igual un nombre sin apellido', () => {
    expect(firstName('Admin')).toBe('Admin');
  });

  it('tolera vacio', () => {
    expect(firstName('')).toBe('');
    expect(firstName(undefined)).toBe('');
  });
});
