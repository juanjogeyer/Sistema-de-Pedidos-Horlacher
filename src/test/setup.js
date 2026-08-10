import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// vitest 4 con jsdom 29 deja window.localStorage como un objeto pelado: existe,
// pero no tiene getItem ni setItem. jsdom por su cuenta lo implementa bien, asi
// que es el entorno de vitest el que lo pisa. La app lo usa para recordar la
// sesion, de modo que el entorno de test necesita uno que funcione de verdad.
//
// Se define como clase para que los metodos vivan en el prototipo y vi.spyOn
// pueda simular un storage que falla.
class MemoryStorage {
  #data = new Map();

  get length() {
    return this.#data.size;
  }

  key(index) {
    return [...this.#data.keys()][index] ?? null;
  }

  getItem(key) {
    const k = String(key);
    return this.#data.has(k) ? this.#data.get(k) : null;
  }

  setItem(key, value) {
    this.#data.set(String(key), String(value));
  }

  removeItem(key) {
    this.#data.delete(String(key));
  }

  clear() {
    this.#data.clear();
  }
}

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  writable: true,
  value: new MemoryStorage(),
});

afterEach(() => {
  // Desmonta lo renderizado para que los tests no se pisen entre si.
  cleanup();
  window.localStorage.clear();
});
