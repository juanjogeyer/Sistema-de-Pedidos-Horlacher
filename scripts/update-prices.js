/* eslint-disable no-console */
// Actualiza precios de src/data/products.js desde Excel.
// Uso:
//   node scripts/update-prices.js [archivo.xlsx] [--mode=bulto|unidad]
//
// --mode=bulto  (default) → lee columna DERECHA del Excel.
// --mode=unidad           → lee columna IZQUIERDA del Excel.
// Sección GRANEL: siempre lee AMBAS columnas (variant='granel').
//
// Sin archivo: busca en LISTA_DIR el "LISTA MAYORISTA YY-MM-DD.xlsx" más reciente.
// Códigos existentes: actualiza `price`. Códigos nuevos: agrega como 'snacks'.

// Comando para ejecutar:
// npm run update-prices 

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PRODUCTS_PATH = path.join(ROOT, 'src', 'data', 'products.js');

const LISTA_DIR = 'C:\\Users\\produ\\OneDrive\\Escritorio\\Administración Compartido\\LISTA DE PRECIOS\\LISTA MAYORISTA';
const LISTA_REGEX = /^LISTA MAYORISTA (\d{2})-(\d{2})-(\d{2})\.xlsx$/i;

function findLatestLista() {
  if (!fs.existsSync(LISTA_DIR)) {
    console.error(`No encuentro carpeta: ${LISTA_DIR}`);
    process.exit(1);
  }
  const matches = fs.readdirSync(LISTA_DIR)
    .map(name => {
      const m = LISTA_REGEX.exec(name);
      if (!m) return null;
      const [, yy, mm, dd] = m;
      // YY-MM-DD: convert to sortable number
      const key = parseInt(yy + mm + dd, 10);
      return { name, key };
    })
    .filter(Boolean)
    .sort((a, b) => b.key - a.key);

  if (matches.length === 0) {
    console.error(`Sin archivos "LISTA MAYORISTA YY-MM-DD.xlsx" en ${LISTA_DIR}`);
    process.exit(1);
  }
  return path.join(LISTA_DIR, matches[0].name);
}

// Parsear argumentos
const args = process.argv.slice(2);
let mode = 'bulto';
let fileArg = null;
for (const a of args) {
  if (a.startsWith('--mode=')) {
    mode = a.split('=')[1];
  } else if (!a.startsWith('--')) {
    fileArg = a;
  }
}
if (!['bulto', 'unidad'].includes(mode)) {
  console.error(`--mode inválido: "${mode}". Valores: bulto | unidad`);
  process.exit(1);
}

const excelPath = fileArg || findLatestLista();
if (!fs.existsSync(excelPath)) {
  console.error(`No encuentro: ${excelPath}`);
  process.exit(1);
}
console.log(`Modo:    ${mode}`);
console.log(`Archivo: ${excelPath}`);

// ─── 1. Parsear Excel ───────────────────────────────────────────────
const wb = XLSX.readFile(excelPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const grid = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

const upper = (v) => String(v ?? '').trim().toUpperCase();
const norm = (v) => String(v ?? '').trim();

// Excel tiene dos pares de columnas (izq=unidad, der=bulto) por header row.
// Regla:
//   - mode=bulto  → secciones normales: solo DERECHA
//   - mode=unidad → secciones normales: solo IZQUIERDA
//   - sección GRANEL → siempre AMBAS, variant='granel'
let leftCodigoCol = -1, leftNombreCol = -1, leftPrecioCol = -1;
let rightCodigoCol = -1, rightNombreCol = -1, rightPrecioCol = -1;
let currentSection = 'normal'; // 'normal' | 'granel'

const excelEntries = new Map(); // code -> { price, name, variant }

const parsePrice = (raw) => {
  if (typeof raw === 'number' && raw > 0) return Math.round(raw);
  if (typeof raw === 'string') {
    const cleaned = raw.replace(/\./g, '').replace(/[^\d]/g, '');
    if (cleaned) return parseInt(cleaned, 10);
  }
  return null;
};

const tryReadEntry = (row, codigoCol, nombreCol, precioCol, variant) => {
  if (codigoCol === -1 || precioCol === -1) return;
  const codeRaw = norm(row[codigoCol]);
  if (!/^\d{1,4}$/.test(codeRaw)) return;
  const code = codeRaw.padStart(4, '0');
  const price = parsePrice(row[precioCol]);
  if (!price) return;
  const name = norm(row[nombreCol]);
  excelEntries.set(code, { price, name, variant });
};

for (const row of grid) {
  if (!Array.isArray(row)) continue;

  // Detectar header row (CODIGO + PRECIO presentes)
  const codigoIdxs = row.map((v, i) => upper(v) === 'CODIGO' ? i : -1).filter(i => i >= 0);
  const precioIdxs = row.map((v, i) => upper(v) === 'PRECIO' ? i : -1).filter(i => i >= 0);
  const descIdxs = row.map((v, i) => upper(v).includes('DESCRIPCION') ? i : -1).filter(i => i >= 0);

  if (codigoIdxs.length >= 1 && precioIdxs.length >= 1) {
    leftCodigoCol = codigoIdxs[0];
    leftPrecioCol = precioIdxs[0];
    leftNombreCol = descIdxs.find(i => i > leftCodigoCol && i < leftPrecioCol) ?? leftCodigoCol + 1;
    rightCodigoCol = codigoIdxs[codigoIdxs.length - 1];
    rightPrecioCol = precioIdxs[precioIdxs.length - 1];
    rightNombreCol = descIdxs.find(i => i > rightCodigoCol) ?? rightCodigoCol + 1;
    currentSection = 'normal';
    continue;
  }

  // Banners de sección
  const rowJoined = row.map(upper).join(' ');
  if (/\bGRANEL\b/.test(rowJoined)) {
    currentSection = 'granel';
    continue;
  }
  if (/PRODUCTOS\s+CROPP|REPOSTERIA/.test(rowJoined)) {
    currentSection = 'normal';
    continue;
  }

  // Lectura de fila
  if (currentSection === 'granel') {
    tryReadEntry(row, leftCodigoCol, leftNombreCol, leftPrecioCol, 'granel');
    tryReadEntry(row, rightCodigoCol, rightNombreCol, rightPrecioCol, 'granel');
  } else if (mode === 'bulto') {
    tryReadEntry(row, rightCodigoCol, rightNombreCol, rightPrecioCol, 'bulto');
  } else {
    tryReadEntry(row, leftCodigoCol, leftNombreCol, leftPrecioCol, 'unidad');
  }
}

console.log(`Filas leídas del Excel: ${excelEntries.size}`);

// ─── 2. Actualizar precios en products.js ───────────────────────────
let source = fs.readFileSync(PRODUCTS_PATH, 'utf8');
const existingCodes = new Set();
let updated = 0;
let kept = 0;

source = source.split('\n').map(line => {
  const m = line.match(/code:\s*'(\d+)'/);
  if (!m) return line;
  const code = m[1];
  existingCodes.add(code);
  const entry = excelEntries.get(code);
  if (!entry) return line;

  return line.replace(/(price:\s*)(\d+)/, (_, p, oldPrice) => {
    if (parseInt(oldPrice, 10) === entry.price) {
      kept++;
      return p + oldPrice;
    }
    updated++;
    console.log(`  ${code}: ${oldPrice} → ${entry.price}`);
    return p + entry.price;
  });
}).join('\n');

// ─── 3. Agregar códigos nuevos al final ─────────────────────────────
const newCodes = [...excelEntries.keys()].filter(c => !existingCodes.has(c)).sort();
if (newCodes.length > 0) {
  const niceName = (s) => s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^./, c => c.toUpperCase());

  const block = newCodes.map(code => {
    const { price, name, variant } = excelEntries.get(code);
    return `  { code: '${code}', name: '${niceName(name)}', category: 'snacks', variant: '${variant}', price: ${price} },`;
  }).join('\n');

  const banner = `\n  // ─── NUEVOS DESDE EXCEL — REVISAR NAME/CATEGORY ─────────────\n`;
  source = source.replace(/(\n\];)/, `\n${banner}${block}\n$1`);
}

fs.writeFileSync(PRODUCTS_PATH, source, 'utf8');

// ─── 4. Reporte ─────────────────────────────────────────────────────
const notInExcel = [...existingCodes].filter(c => !excelEntries.has(c));

console.log('');
console.log(`Precios actualizados:    ${updated}`);
console.log(`Sin cambio (igual):      ${kept}`);
console.log(`Nuevos agregados:        ${newCodes.length}`);
console.log(`Existentes no en Excel:  ${notInExcel.length}`);
if (newCodes.length) console.log(`  Nuevos: ${newCodes.join(', ')}`);
if (notInExcel.length) console.log(`  Sin match en Excel: ${notInExcel.join(', ')}`);
