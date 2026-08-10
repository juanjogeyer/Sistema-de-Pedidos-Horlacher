import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { firstName } from '../../config/users';

const eduardo = { id: 'eduardo', name: 'Eduardo Horlacher', role: 'vendedor' };
const admin = { id: 'admin', name: 'Admin', role: 'admin' };

function renderHeader(props = {}) {
  return render(
    <Header
      activeTab="order"
      setActiveTab={() => {}}
      pendingCount={0}
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

  it('muestra el contador de pendientes solo si hay', () => {
    const { unmount } = renderHeader({ pendingCount: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
    unmount();

    renderHeader({ pendingCount: 0 });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('cambia de pestana', async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();
    renderHeader({ setActiveTab });

    await user.click(screen.getByRole('button', { name: 'Historial' }));

    expect(setActiveTab).toHaveBeenCalledWith('history');
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
