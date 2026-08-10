import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { APP_NAME } from '../../config/app';
import { firstName } from '../../config/users';

// Recibe el usuario por prop en vez de leer el contexto: quien lo monta ya
// verifico que hay sesion, y asi el Header no puede quedar renderizado contra
// un user en null mientras el arbol de arriba se reacomoda.
export function Header({ activeTab, setActiveTab, pendingCount, user, onLogout }) {
  const [imgError, setImgError] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!imgError ? (
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-9 w-auto object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-9 h-9 bg-brand-blue rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
              {APP_NAME.charAt(0)}
            </div>
          )}
          {/* El nombre del vendedor va en el titulo, no repetido al lado del
              boton de salir: en un celular angosto no sobra lugar. */}
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            Pedidos {firstName(user.name)}
          </h1>
        </div>

        <button
          onClick={onLogout}
          title="Salir"
          aria-label="Salir"
          className="p-2 rounded-lg text-gray-500 hover:text-brand-red hover:bg-brand-red-light transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 flex gap-4 mt-2">
        <button
          onClick={() => setActiveTab('order')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'order' 
              ? 'border-brand-blue text-brand-blue' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Hacer pedido
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending' 
              ? 'border-brand-blue text-brand-blue' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pedidos pendientes
          {pendingCount > 0 && (
            <span className="bg-brand-red text-white text-xs px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Historial
        </button>
      </div>
    </header>
  );
}
