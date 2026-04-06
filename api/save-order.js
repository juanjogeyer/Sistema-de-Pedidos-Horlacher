import PDFDocument from 'pdfkit';
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const order = req.body;
    const datePart = order.date.split('T')[0];
    // Reemplaza espacios y caracteres raros para la URL
    const clientPart = order.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const filename = `pedidos/Pedido_${datePart}_${clientPart}.pdf`;
    
    // Creamos el PDF en memoria en lugar de guardarlo en disco
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    
    // En lugar de stream a disco, guardamos en un array de buffers
    doc.on('data', chunk => chunks.push(chunk));
    
    // --- Mismo código de dibujo de PDF que tenías ---
    doc.fontSize(24).font('Helvetica-Bold').text('Pedidos Horlacher', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text('Comprobante de Pedido', { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(12).font('Helvetica').text(`Fecha: ${new Date(order.date).toLocaleString()}`);
    doc.moveDown(1);
    
    doc.fontSize(14).font('Helvetica-Bold').text(`Cliente: ${order.name}`);
    if (order.billing) {
      doc.font('Helvetica').text(`Facturación: ${order.billing}`);
    }
    if (order.express) {
      doc.font('Helvetica').text(`Expreso: ${order.express}`);
    }
    doc.moveDown(2);
    
    doc.font('Helvetica-Bold').text('Detalle de Pedido:');
    doc.moveDown(0.5);
    
    let total = 0;
    order.cart.forEach((item) => {
      doc.font('Helvetica').text(`${item.quantity}x ${item.name} (${item.variant})`);
      total += item.quantity;
    });
    
    doc.moveDown(2);
    doc.font('Helvetica-Bold').text(`Total Ítems: ${total}`);
    // -----------------------------------------------

    doc.end();

    // Esperamos a que termine de procesar el PDF
    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Subimos a Vercel Blob usando las credenciales de Vercel
    const blob = await put(filename, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf'
      // No hace falta pasar 'token' aquí si la variable BLOB_READ_WRITE_TOKEN
      // está configurada en el Dashboard de Vercel.
    });

    return res.status(200).json({ success: true, url: blob.url });

  } catch (err) {
    console.error('Error procesando PDF:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
