import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'save-order-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.method === 'POST' && req.url === '/api/save-order') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const order = JSON.parse(body);
                // Formato de nombre: YYYY-MM-DD_NombreDelCliente.pdf
                const datePart = order.date.split('T')[0];
                const clientPart = order.name.replace(/\s+/g, '_');
                const filename = `${datePart}_${clientPart}.pdf`;
                
                const dir = path.resolve(__dirname, 'pedidos');
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                
                const filePath = path.join(dir, filename);
                
                // Crear y guardar el PDF
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);
                
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
                
                // Items table header
                doc.font('Helvetica-Bold').text('Detalle de Pedido:');
                doc.moveDown(0.5);
                
                let total = 0;
                order.cart.forEach((item, i) => {
                  doc.font('Helvetica').text(`${item.quantity}x ${item.name} (${item.variant})`);
                  total += item.quantity;
                });
                
                doc.moveDown(2);
                doc.font('Helvetica-Bold').text(`Total Ítems: ${total}`);
                
                doc.end();
                
                // Responder solo cuando se termine de escribir
                stream.on('finish', () => {
                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true, path: filename }));
                });
                stream.on('error', (err) => {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: err.message }));
                });
                
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})