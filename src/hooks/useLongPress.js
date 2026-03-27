import { useRef, useCallback, useEffect } from 'react';

export function useLongPress(callback, delay = 400, interval = 80) {
  const callbackRef = useRef(callback);
  
  // Mantener la referencia actualizada sin causar re-renders
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const timeoutRef = useRef();
  const intervalRef = useRef();

  const start = useCallback((e) => {
    // Evitar que el touch triggee el mouse events o seleccione texto
    // e.preventDefault(); // Comentado para no bloquear scroll sin querer
    
    // Disparar click inicial
    callbackRef.current(e);

    // Iniciar el temporizador para el long press
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        callbackRef.current(e);
      }, interval);
    }, delay);
  }, [delay, interval]);

  const clear = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  }, []);

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    // Context menu intercept para evitar el popup en celulares al mantener
    onContextMenu: (e) => e.preventDefault()
  };
}
