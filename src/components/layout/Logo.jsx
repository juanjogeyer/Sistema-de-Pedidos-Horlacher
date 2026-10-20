import { useState } from 'react';
import { APP_NAME } from '../../config/app';

// Si el logo no carga, cae a un cuadro con la inicial en vez de dejar el hueco
// del icono roto. Lo usan el Header y el Login, con tamanos distintos.
const SIZES = {
  sm: { img: 'h-9 w-auto', box: 'w-9 h-9 rounded-xl text-base' },
  lg: { img: 'h-16 w-auto', box: 'w-16 h-16 rounded-2xl text-2xl' },
};

export function Logo({ size = 'sm' }) {
  const [failed, setFailed] = useState(false);
  const { img, box } = SIZES[size] ?? SIZES.sm;

  if (failed) {
    return (
      <div
        className={`${box} bg-brand-blue flex items-center justify-center text-white font-bold shadow-sm`}
      >
        {APP_NAME.charAt(0)}
      </div>
    );
  }

  return (
    // alt vacio a proposito: el nombre de la app siempre esta al lado como
    // texto, asi que anunciarlo dos veces solo estorba.
    <img
      src="/logo.png"
      alt=""
      className={`${img} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}
