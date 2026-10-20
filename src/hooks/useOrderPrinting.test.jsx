import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { useOrderPrinting } from './useOrderPrinting';

const addImage = vi.fn();
const save = vi.fn();

vi.mock('html2canvas', () => ({
  default: vi.fn(async () => ({
    width: 1600,
    height: 2000,
    toDataURL: () => 'data:image/jpeg;base64,xxx',
  })),
}));

// El hook hace `new jsPDF(...)`, asi que el mock tiene que ser construible:
// una arrow function no lo es.
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function jsPDFMock() {
    return {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      addImage,
      save,
    };
  }),
}));

const order = { id: 'a1', name: 'Kiosco Luna', cart: [], date: '2026-08-07T10:00:00Z' };

// Monta el hook y le enchufa un elemento falso como destino de impresion.
function setup({ onAfterPrint, scrollHeight = 500 } = {}) {
  const { result } = renderHook(() => useOrderPrinting({ onAfterPrint }));
  const element = { scrollHeight, style: {} };
  result.current.printRef.current = element;
  return { result, element };
}

describe('useOrderPrinting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('genera el PDF y abre el dialogo de impresion', async () => {
    const { result } = setup();

    await act(async () => {
      result.current.printOrder(order);
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(addImage).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledOnce();
    expect(window.print).toHaveBeenCalledOnce();
  });

  it('nombra el archivo con el cliente y la fecha', async () => {
    const { result } = setup();

    await act(async () => {
      result.current.printOrder(order);
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(save).toHaveBeenCalledWith(expect.stringMatching(/^pedido-Kiosco-Luna-.*\.pdf$/));
  });

  it('avisa recien despues de imprimir, para que el pedido no se marque antes', async () => {
    const onAfterPrint = vi.fn(() => {
      expect(window.print).toHaveBeenCalled();
    });
    const { result } = setup({ onAfterPrint });

    await act(async () => {
      result.current.printOrder(order);
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(onAfterPrint).toHaveBeenCalledWith(order);
  });

  it('sin onAfterPrint imprime igual: es el caso de Reimprimir', async () => {
    const { result } = setup();

    await act(async () => {
      result.current.printOrder(order);
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(window.print).toHaveBeenCalledOnce();
  });

  // El ajuste a A4 es la razon de ser de esta tarea: Historial imprimia sin el,
  // asi que un pedido largo reimpreso se partia en dos hojas.
  it('achica el contenido que no entra en una A4 mientras imprime', async () => {
    const { result, element } = setup({ scrollHeight: 2092 });
    let zoomAlImprimir;
    window.print = vi.fn(() => {
      zoomAlImprimir = element.style.zoom;
    });

    await act(async () => {
      result.current.printOrder(order);
      await vi.advanceTimersByTimeAsync(500);
    });

    // 1046 / 2092 = 50%
    expect(zoomAlImprimir).toBe('50%');
    // Y lo restaura, para que la pantalla no quede achicada.
    expect(element.style.zoom).toBe('');
  });

  it('no achica el contenido que ya entra en una hoja', async () => {
    const { result, element } = setup({ scrollHeight: 500 });
    let zoomAlImprimir;
    window.print = vi.fn(() => {
      zoomAlImprimir = element.style.zoom;
    });

    await act(async () => {
      result.current.printOrder(order);
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(zoomAlImprimir).toBeUndefined();
  });

  it('expone el pedido en curso y lo limpia al terminar', async () => {
    const { result } = setup();

    expect(result.current.printingOrder).toBeNull();

    await act(async () => {
      result.current.printOrder(order);
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.printingOrder).toBeNull();
  });
});

// Caso 13 del spec: que las dos implementaciones de PDF no vuelvan a divergir.
describe('un solo camino a PDF en toda la app', () => {
  const SRC = path.resolve(import.meta.dirname, '..');
  const PDF_IMPORT = /from\s+['"](html2pdf\.js|html2canvas|jspdf)['"]/;

  function jsFilesIn(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return jsFilesIn(full);
      return /\.jsx?$/.test(entry.name) ? [full] : [];
    });
  }

  it('solo useOrderPrinting importa html2canvas, jspdf o html2pdf', () => {
    const offenders = jsFilesIn(SRC)
      .filter((file) => !file.endsWith('useOrderPrinting.js'))
      .filter((file) => PDF_IMPORT.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(SRC, file));

    expect(offenders).toEqual([]);
  });
});
