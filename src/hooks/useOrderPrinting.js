import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Unico camino a PDF de la app.
//
// Antes habia dos: Pendientes armaba el PDF a mano con html2canvas + jsPDF y
// ajustaba el resultado a una hoja A4, e Historial usaba html2pdf.js sin ese
// ajuste, asi que un pedido largo reimpreso se partia en dos hojas. Este hook
// se queda con la version que ajusta.

// Milimetros por pixel a 96dpi.
const MM_PER_PX = 0.2646;
// El canvas se captura al doble de resolucion; hay que dividir antes de pasar a mm.
const CAPTURE_SCALE = 2;
const PAGE_MARGIN_MM = 10;
// 277mm a 96dpi: el alto util de una A4 descontando margenes.
const A4_HEIGHT_PX = 1046;
// Le da tiempo a React de pintar el PrintableOrder oculto antes de capturarlo.
const RENDER_DELAY_MS = 500;

function buildFilename(order) {
  const dateStr = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
  return `pedido-${order.name.replace(/\s+/g, '-')}-${dateStr}.pdf`;
}

async function savePdf(element, filename) {
  const canvas = await html2canvas(element, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    allowTaint: true,
    logging: false,
    windowWidth: 800,
  });

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const maxWidth = pdf.internal.pageSize.getWidth() - PAGE_MARGIN_MM * 2;
  const maxHeight = pdf.internal.pageSize.getHeight() - PAGE_MARGIN_MM * 2;

  const imageWidth = (canvas.width / CAPTURE_SCALE) * MM_PER_PX;
  const imageHeight = (canvas.height / CAPTURE_SCALE) * MM_PER_PX;
  const ratio = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);

  pdf.addImage(
    canvas.toDataURL('image/jpeg', 0.98),
    'JPEG',
    PAGE_MARGIN_MM,
    PAGE_MARGIN_MM,
    imageWidth * ratio,
    imageHeight * ratio
  );
  pdf.save(filename);
}

// Achica el contenido para que el dialogo de impresion entre en una sola hoja.
function printFittedToPage(element) {
  const needsShrink = Boolean(element) && element.scrollHeight > A4_HEIGHT_PX;
  if (needsShrink) {
    element.style.zoom = `${(A4_HEIGHT_PX / element.scrollHeight) * 100}%`;
  }
  window.print();
  if (element) element.style.zoom = '';
}

/**
 * @param {object}   options
 * @param {Function} [options.onAfterPrint] Se llama con el pedido una vez
 *   generado el PDF y abierto el dialogo. Pendientes lo usa para marcar el
 *   pedido como impreso; Historial no lo pasa, porque reimprimir no cambia nada.
 */
export function useOrderPrinting({ onAfterPrint } = {}) {
  const [printingOrder, setPrintingOrder] = useState(null);
  const printRef = useRef(null);

  const printOrder = useCallback(
    (order) => {
      setPrintingOrder(order);

      setTimeout(async () => {
        try {
          const element = printRef.current;
          if (element) {
            await savePdf(element, buildFilename(order));
          }
          printFittedToPage(element);
          onAfterPrint?.(order);
        } catch (err) {
          alert('Error al generar PDF: ' + err.message);
          console.error(err);
        } finally {
          setPrintingOrder(null);
        }
      }, RENDER_DELAY_MS);
    },
    [onAfterPrint]
  );

  return { printingOrder, printRef, printOrder };
}
