import { createContext, useContext } from 'react';

// El contexto y el hook viven aca; el provider vive en
// components/auth/AuthProvider.jsx. Separados porque un archivo que exporta un
// componente y ademas otras cosas rompe el fast refresh de Vite.
export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  }
  return context;
}
