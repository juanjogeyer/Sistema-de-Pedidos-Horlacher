import { useAuth } from './hooks/useAuth';
import { ROLES } from './config/users';
import { Login } from './components/auth/Login';
import { VendorApp } from './apps/VendorApp';
import { AdminApp } from './apps/AdminApp';

// Todo lo que hace App es decidir que arbol montar. Vendedor y admin no
// comparten ninguna pantalla, asi que tampoco comparten componentes de vista:
// el boton de imprimir no esta deshabilitado del lado del vendedor, no existe.
export default function App() {
  const { user, logout } = useAuth();

  if (!user) return <Login />;

  return user.role === ROLES.ADMIN ? (
    <AdminApp user={user} onLogout={logout} />
  ) : (
    <VendorApp user={user} onLogout={logout} />
  );
}
