import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login';
import { AuthProvider } from './AuthProvider';
import { useAuth } from '../../hooks/useAuth';

// Muestra a quien quedo logueado, para poder afirmar sobre el resultado.
function SessionProbe() {
  const { user } = useAuth();
  return <p>{user ? `dentro: ${user.name}` : 'afuera'}</p>;
}

function renderLogin() {
  return render(
    <AuthProvider>
      <Login />
      <SessionProbe />
    </AuthProvider>
  );
}

const typePin = async (user, pin) => {
  for (const digit of pin) {
    await user.click(screen.getByRole('button', { name: digit }));
  }
};

describe('Login', () => {
  // Caso 8 del spec.
  it('ofrece los tres usuarios', () => {
    renderLogin();

    expect(screen.getByRole('button', { name: /Eduardo Horlacher/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Carlos Riera/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Admin/ })).toBeInTheDocument();
  });

  it('no muestra el teclado hasta elegir usuario', () => {
    renderLogin();

    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
  });

  it('entra con el PIN correcto', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /Eduardo Horlacher/ }));
    await typePin(user, '002');

    expect(screen.getByText('dentro: Eduardo Horlacher')).toBeInTheDocument();
  });

  it('con el PIN incorrecto avisa y no entra', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /Carlos Riera/ }));
    await typePin(user, '999');

    expect(screen.getByRole('alert')).toHaveTextContent('PIN incorrecto');
    expect(screen.getByText('afuera')).toBeInTheDocument();
  });

  it('deja reintentar despues de fallar, sin bloquear', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /Carlos Riera/ }));
    await typePin(user, '999');
    await typePin(user, '003');

    expect(screen.getByText('dentro: Carlos Riera')).toBeInTheDocument();
  });

  it('no acepta el PIN de otro usuario', async () => {
    const user = userEvent.setup();
    renderLogin();

    // 001 es el PIN del admin.
    await user.click(screen.getByRole('button', { name: /Eduardo Horlacher/ }));
    await typePin(user, '001');

    expect(screen.getByText('afuera')).toBeInTheDocument();
  });

  it('el boton de borrar saca el ultimo digito', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /Admin/ }));
    await typePin(user, '00');
    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    // Quedaba '0'; con '01' el PIN seria '001' solo si no se hubiera borrado.
    await typePin(user, '01');

    expect(screen.getByText('dentro: Admin')).toBeInTheDocument();
  });

  it('se puede cambiar de usuario antes de completar el PIN', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /Eduardo Horlacher/ }));
    await user.click(screen.getByRole('button', { name: /Cambiar usuario/ }));

    expect(screen.getByRole('button', { name: /Carlos Riera/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
  });

  it('la sesion sobrevive a recargar', async () => {
    const user = userEvent.setup();
    const { unmount } = renderLogin();

    await user.click(screen.getByRole('button', { name: /Admin/ }));
    await typePin(user, '001');
    unmount();

    // Montar de cero equivale a recargar la pagina.
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>
    );
    expect(screen.getByText('dentro: Admin')).toBeInTheDocument();
  });
});
