import { useState, useRef } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { PrintableOrder } from './PrintableOrder';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function PendingOrders({ orders, onPrintOrder, onRemoveOrder }) {
  const [printingOrder, setPrintingOrder] = useState(null);
  const printRef = useRef(null);

  const handlePrint = (order) => {
    setPrintingOrder(order);

    setTimeout(async () => {
      try {
        const element = printRef.current;
        if (element) {
          const dateStr = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
          const filename = `pedido-${order.name.replace(/\s+/g, '-')}-${dateStr}.pdf`;

          const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true, logging: false, windowWidth: 800 });
          const imgData = canvas.toDataURL('image/jpeg', 0.98);

          const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
          const margin = 10;
          const maxW = pdf.internal.pageSize.getWidth() - margin * 2;
          const maxH = pdf.internal.pageSize.getHeight() - margin * 2;

          const imgWmm = (canvas.width / 2) * 0.2646;
          const imgHmm = (canvas.height / 2) * 0.2646;
          const ratio = Math.min(maxW / imgWmm, maxH / imgHmm);

          pdf.addImage(imgData, 'JPEG', margin, margin, imgWmm * ratio, imgHmm * ratio);
          pdf.save(filename);
        }

        // Scale print dialog to fit one A4 page
        const A4_HEIGHT_PX = 1046; // 277mm at 96dpi
        if (element && element.scrollHeight > A4_HEIGHT_PX) {
          element.style.zoom = `${(A4_HEIGHT_PX / element.scrollHeight) * 100}%`;
        }

        window.print();
        if (element) element.style.zoom = '';
        onPrintOrder(order.id);
      } catch (err) {
        alert('Error al generar PDF: ' + err.message);
        console.error(err);
      } finally {
        setPrintingOrder(null);
      }
    }, 500);
  };

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400">No hay pedidos pendientes</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 p-4 print:hidden">
        {orders.map((order) => {
          const totalItems = order.cart.reduce((sum, item) => sum + item.quantity, 0);
          
          return (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{order.name}</h3>
                  {order.billing && <p className="text-sm text-gray-600">Facturación: {order.billing}</p>}
                  {order.express && <p className="text-sm text-gray-600">Expreso: {order.express}</p>}
                  <p className="text-xs text-gray-400 mt-1 flex gap-2">
                    <span>{new Date(order.date).toLocaleDateString()}</span>
                    <span>{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
                <div className="text-sm font-medium bg-gray-100 px-2 py-1 rounded-lg">
                  {totalItems} ítems
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-4 max-h-32 overflow-y-auto">
                <ul className="space-y-1">
                  {order.cart.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-medium">{item.quantity}x</span>
                      <span className="truncate">{item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint(order)}
                  className="flex-1 bg-brand-blue text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-brand-blue-dark transition-colors"
                >
                  <Printer size={18} />
                  Imprimir
                </button>
                <button
                  onClick={() => onRemoveOrder(order.id)}
                  className="px-4 py-2.5 rounded-xl font-medium text-brand-red bg-brand-red-light hover:bg-red-100 transition-colors flex items-center justify-center"
                  title="Eliminar pedido sin imprimir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden print renderer */}
      <div className="fixed left-[-9999px] top-[-9999px] print:static print:left-auto print:top-auto">
        <div ref={printRef} className="w-[800px] bg-white p-4 print:w-auto print:p-0">
          {printingOrder && <PrintableOrder order={printingOrder} />}
        </div>
      </div>
    </>
  );
}
