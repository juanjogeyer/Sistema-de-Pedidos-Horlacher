import { useState } from 'react';
import { ShoppingCart, Send, User, X } from 'lucide-react';

export function CartBar({ cart, totalItems, onConfirm }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [billing, setBilling] = useState('');
  const [express, setExpress] = useState('');

  if (totalItems === 0) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !billing || !express) return;
    onConfirm({ cart, name, billing, express });
    setOpen(false);
    setName('');
    setBilling('');
    setExpress('');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      {/* Checkout panel */}
      {open && (
        <div className="bg-white border-t border-gray-200 px-4 pt-5 pb-4 shadow-2xl">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Confirmar Pedido</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Cart summary */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-40 overflow-y-auto no-scrollbar">
              {cart.map((item) => (
                <div key={item.code} className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-700">{item.quantity}× {item.name}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-700">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Cliente *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-3 text-gray-600 border border-gray-200 rounded-xl focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-colors text-sm"
                />
              </div>

              <div className="flex gap-2">
                <select
                  required
                  value={billing}
                  onChange={(e) => setBilling(e.target.value)}
                  className={`block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-blue focus:bg-white focus:ring-1 focus:ring-brand-blue transition-colors text-sm appearance-none ${billing ? 'text-gray-900' : 'text-gray-600'
                    }`}
                >
                  <option value="" disabled>Facturación *</option>
                  <option value="9 + 1/2 IVA">9 + 1/2 IVA</option>
                  <option value="9 + IVA">9 + IVA</option>
                  <option value="9 + 10,5%">9 + 10,5%</option>
                </select>

                <select
                  required
                  value={express}
                  onChange={(e) => setExpress(e.target.value)}
                  className={`block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-blue focus:bg-white focus:ring-1 focus:ring-brand-blue transition-colors text-sm appearance-none ${express ? 'text-gray-900' : 'text-gray-600'
                    }`}
                >
                  <option value="" disabled>Expreso *</option>
                  <option value="TransFer">TransFer</option>
                  <option value="Mario Fernandez">Mario Fernandez</option>
                  <option value="Maldonado">Maldonado</option>
                  <option value="Camion Propio">Camion Propio</option>
                  <option value="Log Pic">Log Pic</option>
                  <option value="Benito Escudero">Benito Escudero</option>
                  <option value="Gonzalo">Gonzalo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-blue text-white font-medium px-5 py-3 rounded-xl hover:bg-brand-blue-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20"
              >
                <Send size={18} fill="currentColor" />
                Enviar Pedido
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sticky bottom bar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-brand-blue text-white flex items-center justify-between px-5 py-4 hover:bg-brand-blue-dark transition-colors"
      >
        <div className="flex items-center gap-3 max-w-xl mx-auto w-full">
          <div className="bg-white/20 rounded-full p-1.5">
            <ShoppingCart size={18} />
          </div>
          <span className="font-medium">{totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}</span>
          <span className="ml-auto text-sm text-gray-300">
            {open ? 'Cerrar ↓' : 'Confirmar pedido →'}
          </span>
        </div>
      </button>
    </div>
  );
}
