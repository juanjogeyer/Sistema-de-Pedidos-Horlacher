import { LogOut } from 'lucide-react';
import { firstName } from '../../config/users';
import { Logo } from './Logo';

// Recibe el usuario por prop en vez de leer el contexto: quien lo monta ya
// verifico que hay sesion, y asi el Header no puede quedar renderizado contra
// un user en null mientras el arbol de arriba se reacomoda.
//
// Las pestanas tambien llegan como dato, porque vendedor y admin tienen juegos
// distintos. El Header no sabe que rol es cual: dibuja lo que le den.
//
// @param {Array<{id: string, label: string, badge?: number}>} tabs
export function Header({ tabs, activeTab, onTabChange, user, onLogout }) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
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

      <nav className="max-w-2xl mx-auto px-4 flex gap-4 mt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-brand-red text-white text-xs px-2 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </header>
  );
}
