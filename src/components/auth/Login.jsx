import { useState } from 'react';
import { Delete, ChevronLeft, User } from 'lucide-react';
import { USERS, PIN_LENGTH } from '../../config/users';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME } from '../../config/app';
import { Logo } from '../layout/Logo';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function Login() {
  const { login } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const selected = USERS.find((user) => user.id === selectedId);

  const selectUser = (id) => {
    setSelectedId(id);
    setPin('');
    setError('');
  };

  const back = () => {
    setSelectedId(null);
    setPin('');
    setError('');
  };

  const pressDigit = (digit) => {
    if (pin.length >= PIN_LENGTH) return;

    const next = pin + digit;
    setPin(next);
    setError('');

    // Valida sola al completar el PIN: no hay boton de confirmar.
    if (next.length === PIN_LENGTH && !login(selectedId, next)) {
      // Sin bloqueo ni contador de intentos: el PIN viaja en el bundle, asi que
      // un lockout no compra seguridad y si puede dejar a un vendedor afuera
      // en medio de la ruta.
      setError('PIN incorrecto');
      setPin('');
    }
  };

  const eraseDigit = () => {
    setPin((current) => current.slice(0, -1));
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Logo size="lg" />
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            {APP_NAME}
          </h1>
        </div>

        {!selected ? (
          <>
            <p className="text-center text-sm text-gray-500 mb-4">¿Quién sos?</p>
            <div className="flex flex-col gap-3">
              {USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => selectUser(user.id)}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-3 hover:border-brand-blue hover:bg-brand-blue-light transition-colors"
                >
                  <span className="bg-brand-blue-light text-brand-blue rounded-full p-2">
                    <User size={18} />
                  </span>
                  <span className="font-medium text-gray-900">{user.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={back}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
            >
              <ChevronLeft size={16} />
              Cambiar usuario
            </button>

            <p className="text-center font-medium text-gray-900 mb-1">{selected.name}</p>
            <p className="text-center text-sm text-gray-500 mb-5">Ingresá tu PIN</p>

            <div className="flex justify-center gap-3 mb-2" aria-hidden="true">
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <span
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                    i < pin.length
                      ? 'bg-brand-blue border-brand-blue'
                      : 'border-gray-300'
                  }`}
                />
              ))}
            </div>

            <p
              role="alert"
              className={`text-center text-sm h-6 ${error ? 'text-brand-red' : 'text-transparent'}`}
            >
              {error || ' '}
            </p>

            <div className="grid grid-cols-3 gap-3 mt-2">
              {KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => pressDigit(key)}
                  className="bg-white border border-gray-200 rounded-2xl py-4 text-xl font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  {key}
                </button>
              ))}
              <span />
              <button
                onClick={() => pressDigit('0')}
                className="bg-white border border-gray-200 rounded-2xl py-4 text-xl font-medium text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                0
              </button>
              <button
                onClick={eraseDigit}
                aria-label="Borrar"
                className="rounded-2xl py-4 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Delete size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
