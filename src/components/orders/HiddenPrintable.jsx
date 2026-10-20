import { PrintableOrder } from './PrintableOrder';

// El comprobante se dibuja fuera de pantalla y solo entra en el flujo al
// imprimir. html2canvas lo captura desde ahi, por eso necesita estar montado y
// con ancho fijo aunque no se vea.
export function HiddenPrintable({ order, printRef }) {
  return (
    <div className="fixed left-[-9999px] top-[-9999px] print:static print:left-auto print:top-auto">
      <div ref={printRef} className="w-[800px] bg-white p-4 print:w-auto print:p-0">
        {order && <PrintableOrder order={order} />}
      </div>
    </div>
  );
}
