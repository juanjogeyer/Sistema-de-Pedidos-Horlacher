import { AlertCircle, X } from 'lucide-react';

// No es un sistema de notificaciones: es el cartel mas chico que convierte
// "se perdio" en "fallo, proba de nuevo".
export function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;

  return (
    <div
      role="alert"
      className="mx-4 mt-4 bg-brand-red-light border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3 print:hidden"
    >
      <AlertCircle size={18} className="text-brand-red flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">{error.message}</p>
        {error.retry && (
          <button
            onClick={error.retry}
            className="mt-2 text-sm font-medium text-brand-red hover:underline"
          >
            Reintentar
          </button>
        )}
      </div>

      <button
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
