/* eslint-disable no-console */
// Sincroniza el catálogo src/data/products.js contra el Excel de lista.
// El catálogo ya NO guarda precios: el script solo detecta altas y bajas.
//
// Uso:
//   node scripts/update-prices.js [archivo.xlsx] [--mode=grande|unidad]
//
// --mode=grande (default) → lee columna DERECHA del Excel.
// --mode=unidad           → lee columna IZQUIERDA del Excel.
// Sección GRANEL: siempre lee AMBAS columnas (variant='granel').
//
// Sin archivo: busca en LISTA_DIR el "LISTA MAYORISTA YY-MM-DD.xlsx" más reciente.
// Códigos nuevos: los agrega como 'snacks' (revisar category/variant a mano).
// Códigos existentes: NO se tocan, solo se reportan los que no están en el Excel
// y los que tienen el nombre distinto.

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
let mode = 'grande';
let fileArg = null;
for (const a of args) {
  if (a.startsWith('--mode=')) {
    mode = a.split('=')[1];
  } else if (!a.startsWith('--')) {
    fileArg = a;
  }
}
if (mode === 'bulto') mode = 'grande'; // alias viejo
if (!['grande', 'unidad'].includes(mode)) {
  console.error(`--mode inválido: "${mode}". Valores: grande | unidad`);
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
//   - mode=grande → secciones normales: solo DERECHA
//   - mode=unidad → secciones normales: solo IZQUIERDA
//   - sección GRANEL → siempre AMBAS, variant='granel'
let leftCodigoCol = -1, leftNombreCol = -1, leftPrecioCol = -1;
let rightCodigoCol = -1, rightNombreCol = -1, rightPrecioCol = -1;
let currentSection = 'normal'; // 'normal' | 'granel'

const excelEntries = new Map(); // code -> { name, variant }

// El precio ya no se guarda, pero sigue siendo la señal de que la fila es un
// producto real (las filas de relleno del Excel no tienen precio).
const hasPrice = (raw) => {
  if (typeof raw === 'number' && raw > 0) return true;
  if (typeof raw === 'string') return /\d/.test(raw.replace(/[^\d]/g, ''));
  return false;
};

const tryReadEntry = (row, codigoCol, nombreCol, precioCol, variant) => {
  if (codigoCol === -1 || precioCol === -1) return;
  const codeRaw = norm(row[codigoCol]);
  if (!/^\d{1,4}$/.test(codeRaw)) return;
  const code = codeRaw.padStart(4, '0');
  if (!hasPrice(row[precioCol])) return;
  const name = norm(row[nombreCol]);
  excelEntries.set(code, { name, variant });
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
  } else if (mode === 'grande') {
    tryReadEntry(row, rightCodigoCol, rightNombreCol, rightPrecioCol, 'grande');
  } else {
    tryReadEntry(row, leftCodigoCol, leftNombreCol, leftPrecioCol, 'unidad');
  }
}

console.log(`Filas leídas del Excel: ${excelEntries.size}`);

// ─── 2. Leer catálogo actual ────────────────────────────────────────
let source = fs.readFileSync(PRODUCTS_PATH, 'utf8');
const existing = new Map(); // code -> name en products.js

for (const line of source.split('\n')) {
  const m = line.match(/code:\s*'(\d+)'/);
  if (!m) continue;
  const nameMatch = line.match(/name:\s*'([^']*)'/);
  existing.set(m[1], nameMatch ? nameMatch[1] : '');
}

// ─── 3. Agregar códigos nuevos al final ─────────────────────────────
const niceName = (s) => s
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .replace(/^./, c => c.toUpperCase());

const newCodes = [...excelEntries.keys()].filter(c => !existing.has(c)).sort();
if (newCodes.length > 0) {
  const block = newCodes.map(code => {
    const { name, variant } = excelEntries.get(code);
    return `  { code: '${code}', name: '${niceName(name)}', category: 'snacks', variant: '${variant}' },`;
  }).join('\n');

  const banner = `\n  // ─── NUEVOS DESDE EXCEL — REVISAR NAME/CATEGORY/VARIANT ─────\n`;

  // Insertar al cierre del array `products`, no en el primer array del archivo
  const arrayStart = source.indexOf('export const products = [');
  const arrayEnd = arrayStart === -1 ? -1 : source.indexOf('\n];', arrayStart);
  if (arrayEnd === -1) {
    console.error('No encuentro el cierre de `export const products = [` en products.js');
    process.exit(1);
  }
  source = source.slice(0, arrayEnd) + `\n${banner}${block}` + source.slice(arrayEnd);
  fs.writeFileSync(PRODUCTS_PATH, source, 'utf8');
}

// ─── 4. Reporte ─────────────────────────────────────────────────────
const notInExcel = [...existing.keys()].filter(c => !excelEntries.has(c));

// Nombres que difieren (no se tocan: los del catálogo están corregidos a mano).
// Se ignoran tildes, puntos finales y espacios de más: son ruido del Excel.
const flat = (s) => s
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+/g, ' ')
  .replace(/[.\s]+$/, '')
  .trim();
const renamed = [...excelEntries.entries()]
  .filter(([code, e]) => existing.has(code) && flat(existing.get(code)) !== flat(niceName(e.name)))
  .map(([code, e]) => `  ${code}: "${existing.get(code)}"  ≠  Excel: "${niceName(e.name)}"`);

console.log('');
console.log(`Productos en catálogo:   ${existing.size}`);
console.log(`Nuevos agregados:        ${newCodes.length}`);
console.log(`Existentes no en Excel:  ${notInExcel.length}`);
console.log(`Nombres distintos:       ${renamed.length}`);
if (newCodes.length) console.log(`  Nuevos: ${newCodes.join(', ')}`);
if (notInExcel.length) console.log(`  Sin match en Excel: ${notInExcel.join(', ')}`);
if (renamed.length) {
  console.log('  Revisar nombres (no se modifican solos):');
  renamed.forEach(l => console.log(l));
}
