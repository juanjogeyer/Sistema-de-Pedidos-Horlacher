// Catálogo de productos
// Campos: code, name, category, variant

export const CATEGORIES = [
  { id: 'snacks', label: 'Dulxelitos' },
  { id: 'cropp', label: 'Croppers' },
  { id: 'reposteria', label: 'Repostería' },
];

// Orden y etiquetas de las variantes (subsecciones dentro de cada categoría)
export const VARIANTS = [
  { id: 'grande', label: 'Paquetes Grandes' },
  { id: 'chico', label: 'Paquetes Chicos' },
  { id: 'granel', label: 'Granel' },
];

export const products = [

  // ─── SNACKS — PAQUETES GRANDES ──────────────────────────────
  { code: '0092', name: 'Aros de trigo sabor cebolla 6 x 500 grs', category: 'snacks', variant: 'grande' },
  { code: '0007', name: 'Bolita crocante 7 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0009', name: 'Cascarones pizza 3 x 500 gs', category: 'snacks', variant: 'grande' },
  { code: '0093', name: 'Cascarones pizza 6 x 500 gs', category: 'snacks', variant: 'grande' },
  { code: '0011', name: 'Conitos sabor pizza 6 x 800 gs', category: 'snacks', variant: 'grande' },
  { code: '0025', name: 'Tutuca 10 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0103', name: 'Maní crocante sabor cebolla 10 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0097', name: 'Maní crocante sabor jamón 10 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0099', name: 'Maní crocante sabor panceta 10 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0101', name: 'Maní crocante sabor queso 10 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0105', name: 'Mani crocante sabor pizza 10 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0029', name: 'Maní repelado salado 10 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0033', name: 'Maní tostado 10 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0090', name: 'Orjuela serrana 12 x 500 gr', category: 'snacks', variant: 'grande' },
  { code: '0038', name: 'Orjuela serrana 7 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0048', name: 'Chisito 12 x 500 gs', category: 'snacks', variant: 'grande' },
  { code: '0049', name: 'Chisito 6 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0053', name: 'Palito salado 6 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0095', name: 'Pancetitas 6 x 500 grs', category: 'snacks', variant: 'grande' },
  { code: '0059', name: 'Papa frita 6 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0069', name: 'Papa acanalada 6 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0071', name: 'Papa sabor pizza 6 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0065', name: 'Papa sabor serrano 6 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0086', name: 'Papas fritas pay 6 x 1 kg.', category: 'snacks', variant: 'grande' },
  { code: '0076', name: 'Tubo pizza 6 x 1 kg', category: 'snacks', variant: 'grande' },
  { code: '0079', name: 'Tubo queso 6 x 1 kg', category: 'snacks', variant: 'grande' },

  // ─── GRANEL ─────────────────────────────────────────────────
  { code: '0004', name: 'Bolita crocante 8 kg', category: 'snacks', variant: 'granel' },
  { code: '0022', name: 'Tutuca x 7 kg', category: 'snacks', variant: 'granel' },
  { code: '0036', name: 'Orjuela serrana x 7 kg', category: 'snacks', variant: 'granel' },
  { code: '0044', name: 'Chisito x 7 kg', category: 'snacks', variant: 'granel' },
  { code: '0075', name: 'Tubo pizza x 7 kg', category: 'snacks', variant: 'granel' },
  { code: '0078', name: 'Tubo queso x 7 kg', category: 'snacks', variant: 'granel' },

  // ─── PAQUETES CHICOS (unidad menor a 450 gs) ────────────────
  { code: '0006', name: 'Bolita crocante 10 x 180 gs', category: 'snacks', variant: 'chico' },
  { code: '0005', name: 'Bolita crocante 24 x 80 gs', category: 'snacks', variant: 'chico' },
  { code: '0024', name: 'Tutuca 12 x 180 gs', category: 'snacks', variant: 'chico' },
  { code: '0023', name: 'Tutuca 24 x 80 gs', category: 'snacks', variant: 'chico' },
  { code: '0037', name: 'Orjuela serrana 16 x 80 gs', category: 'snacks', variant: 'chico' },
  { code: '0046', name: 'Chisito 10 x 180 gs', category: 'snacks', variant: 'chico' },
  { code: '0045', name: 'Chisito 16 x 80 gs', category: 'snacks', variant: 'chico' },
  { code: '0052', name: 'Palito salado 20 x 200 gs', category: 'snacks', variant: 'chico' },
  { code: '0058', name: 'Papa fritas 14 x 150 gs', category: 'snacks', variant: 'chico' },
  { code: '0057', name: 'Papa fritas 16 x 80 gs', category: 'snacks', variant: 'chico' },
  { code: '0073', name: 'Papas fritas pay 12 x 500 gs.', category: 'snacks', variant: 'chico' },

  // ─── CROPP — PAQUETES GRANDES ───────────────────────────────
  { code: '0720', name: 'Cropp con cascara 12 x 285 gs', category: 'cropp', variant: 'grande' },
  { code: '0722', name: 'Cropp con cascara 4 x 800 gs', category: 'cropp', variant: 'grande' },
  { code: '0744', name: 'Cropp crocante chilli pepper 40 x 85 gs', category: 'cropp', variant: 'grande' },
  { code: '0736', name: 'Cropp crocante jalapeño 40 x 85 gs', category: 'cropp', variant: 'grande' },
  { code: '0732', name: 'Cropp crocante oliva 40 x 85 gs', category: 'cropp', variant: 'grande' },
  { code: '0734', name: 'Cropp crocante parmesano 40 x 85 gs', category: 'cropp', variant: 'grande' },
  { code: '0730', name: 'Cropp crocante serrano 40 x 85 gs', category: 'cropp', variant: 'grande' },
  { code: '0710', name: 'Cropp frito salado 12 x 105 gs', category: 'cropp', variant: 'grande' },
  { code: '0712', name: 'Cropp frito salado 12 x 350 gs', category: 'cropp', variant: 'grande' },
  { code: '0742', name: 'Cropp maní choco 40 x 85 gs', category: 'cropp', variant: 'grande' },
  { code: '0740', name: 'Cropp mantequilla 12 x 305 gs', category: 'cropp', variant: 'grande' },
  { code: '0738', name: 'Cropp pasta 12 x 305 gs', category: 'cropp', variant: 'grande' },
  { code: '0724', name: 'Cropp sabor BBQ 40 x 85 gs', category: 'cropp', variant: 'grande' },
  { code: '0728', name: 'Cropp sabor crema 40 x 85 gs', category: 'cropp', variant: 'grande' },
  { code: '0726', name: 'Cropp sabor panceta 40 x 85 gs', category: 'cropp', variant: 'grande' },
  { code: '0714', name: 'Cropp tostado 12 x 105 gs', category: 'cropp', variant: 'grande' },
  { code: '0716', name: 'Cropp tostado 12 x 350 gs', category: 'cropp', variant: 'grande' },
  { code: '0718', name: 'Cropp tostado salado 40 x 105 gs', category: 'cropp', variant: 'grande' },

  // ─── REPOSTERÍA — PAQUETES GRANDES ──────────────────────────
  { code: '0202', name: 'Esencia de vainilla 12 x 100 cc', category: 'reposteria', variant: 'grande' },
  { code: '0248', name: 'Grajeas multicolor 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0225', name: 'Granas amarillas 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0213', name: 'Granas azules 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0217', name: 'Granas blancas 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0215', name: 'Granas celestes 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0240', name: 'Granas corazon multicolor 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0238', name: 'Granas estrella multicolor 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0242', name: 'Granas flor multicolor 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0221', name: 'Granas lilas 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0233', name: 'Granas marron 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0219', name: 'Granas multicolor 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0229', name: 'Granas naranja 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0246', name: 'Granas plateada multicolor 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0223', name: 'Granas rojas 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0227', name: 'Granas rosadas 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0234', name: 'Granas surtidas 20 x 40 gs', category: 'reposteria', variant: 'grande' },
  { code: '0231', name: 'Granas verde 20 x 40 gs', category: 'reposteria', variant: 'grande' },
];