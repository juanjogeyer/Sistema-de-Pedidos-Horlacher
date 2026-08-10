import { useState, useCallback, useMemo } from 'react';
import { AuthContext } from '../../hooks/useAuth';
import { USERS } from '../../config/users';

const STORAGE_KEY = 'pedidos.session';

// localStorage puede no estar disponible: modo privado, storage lleno, permisos.
// Perder la persistencia de sesion es aceptable (se vuelve a pedir el PIN);
// que la app no arranque, no.
function readStoredId() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeId(id) {
  try {
    if (id === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Sin persistencia: la sesion dura lo que dure la pestana.
  }
}

// Lo que ve el resto de la app. Deja el PIN afuera a proposito: ningun
// componente tiene por que poder leerlo, ni menos renderizarlo.
function toSessionUser(user) {
  return { id: user.id, name: user.name, role: user.role };
}

function findUser(id) {
  return USERS.find((user) => user.id === id) ?? null;
}

export function AuthProvider({ children }) {
  // El id guardado se resuelve contra USERS en cada arranque, en vez de guardar
  // el usuario entero. Asi cambiarle el rol o el nombre a alguien tiene efecto
  // con solo recargar, y un id que ya no existe se descarta en vez de dejar una
  // sesion fantasma.
  const [user, setUser] = useState(() => {
    const stored = findUser(readStoredId());
    if (!stored) {
      storeId(null);
      return null;
    }
    return toSessionUser(stored);
  });

  const login = useCallback((id, pin) => {
    const candidate = findUser(id);
    if (!candidate || candidate.pin !== pin) return false;

    storeId(candidate.id);
    setUser(toSessionUser(candidate));
    return true;
  }, []);

  const logout = useCallback(() => {
    storeId(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
