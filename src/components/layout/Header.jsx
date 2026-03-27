import { useState } from 'react';
import { APP_NAME } from '../../config/app';

export function Header({ activeTab, setActiveTab, pendingCount }) {
  const [imgError, setImgError] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-[#fafafa]/90 backdrop-blur-md border-b border-gray-200">
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
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
              {APP_NAME.charAt(0)}
            </div>
          )}
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">{APP_NAME}</h1>
        </div>
      </div>
      
      <div className="max-w-xl mx-auto px-4 flex gap-4 mt-2">
        <button
          onClick={() => setActiveTab('order')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'order' 
              ? 'border-gray-900 text-gray-900' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Hacer pedido
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending' 
              ? 'border-gray-900 text-gray-900' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pedidos pendientes
          {pendingCount > 0 && (
            <span className="bg-accent-green text-white text-xs px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
