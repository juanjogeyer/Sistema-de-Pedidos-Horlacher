import { useState } from 'react';
import { User, Send } from 'lucide-react';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { COMPANY_PHONE } from '../../config/app';

export function CheckoutForm({ cart }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || cart.length === 0) return;

    const url = buildWhatsAppUrl(cart, name, COMPANY_PHONE);
    window.open(url, '_blank');
  };

  return (
    <div className="mt-12 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h2 className="text-lg font-medium mb-6">Confirmar Pedido</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
            ¿A nombre de quién?
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <User size={18} />
            </div>
            <input
              type="text"
              required
              className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-black focus:bg-white focus:ring-1 focus:ring-black transition-colors text-sm"
              placeholder="Tu nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            className="w-full bg-accent-green text-white font-medium py-4 px-6 rounded-xl hover:bg-accent-hover transition-colors flex justify-center items-center gap-2 shadow-lg shadow-accent-green/20"
          >
            <Send size={18} fill="currentColor" className="mr-1" />
            Enviar pedido por WhatsApp
          </button>
        </div>
      </form>
    </div>
  );
}
