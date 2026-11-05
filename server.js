import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;
const DIST_DIR = path.resolve(__dirname, 'dist');
export const HISTORY_FILE = path.resolve(__dirname, 'prices-history.json');

export function loadPriceHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // resilient
  }
  return { latest: null, snapshots: {} };
}

export function savePriceHistory(snapshot) {
  try {
    const history = loadPriceHistory();
    const dateKey = new Date().toISOString().split('T')[0];

    history.snapshots = history.snapshots || {};
    history.snapshots[dateKey] = {
      date: dateKey,
      displayDate: snapshot.displayDate || dateKey,
      updatedAt: snapshot.updatedAt,
      brands: {
        antam: { sell: snapshot.brands?.antam?.basePricePerGram || 0, buyback: snapshot.brands?.antam?.buybackPerGram || 0 },
        ubs: { sell: snapshot.brands?.ubs?.basePricePerGram || 0, buyback: snapshot.brands?.ubs?.buybackPerGram || 0 },
        galeri24: { sell: snapshot.brands?.galeri24?.basePricePerGram || 0, buyback: snapshot.brands?.galeri24?.buybackPerGram || 0 },
        hrta: { sell: snapshot.brands?.hrta?.basePricePerGram || 0, buyback: snapshot.brands?.hrta?.buybackPerGram || 0 }
      }
    };
    history.latest = snapshot;

    const keys = Object.keys(history.snapshots).sort();
    if (keys.length > 60) {
      for (const oldKey of keys.slice(0, keys.length - 60)) {
        delete history.snapshots[oldKey];
      }
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch {
    // resilient
  }
}

// ponytail: calibrated fallback rates updated to current market baseline (Nov 2026 ~Rp 2.4-2.5jt/gr)
const BASE_MARKET_RATES = {
  antam: {
    name: 'Antam LM',
    baseSell: 2576000,
    baseBuyback: 2293000,
    fractions: [0.5, 1, 2, 3, 5, 10, 25, 50, 100]
  },
  ubs: {
    name: 'UBS Gold',
    baseSell: 2519000,
    baseBuyback: 2293000,
    fractions: [0.5, 1, 2, 5, 10, 25, 50, 100]
  },
  galeri24: {
    name: 'Galeri 24',
    baseSell: 2463000,
    baseBuyback: 2318000,
    fractions: [0.5, 1, 2, 5, 10, 25, 50, 100]
  },
  hrta: {
    name: 'HRTA Gold (EMASKU)',
    baseSell: 2408000,
    baseBuyback: 2215000,
    fractions: [0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50, 100]
  }
};

export function calculateFractions(baseSell, baseBuyback, weights) {
  return weights.map((w) => {
    let mintingMultiplier = 1.0;
    if (w <= 0.1) mintingMultiplier = 1.25;
    else if (w <= 0.25) mintingMultiplier = 1.15;
    else if (w <= 0.5) mintingMultiplier = 1.07;
    else if (w <= 1) mintingMultiplier = 1.03;
    else if (w <= 3) mintingMultiplier = 1.015;
    else if (w <= 10) mintingMultiplier = 1.008;

    const sellPrice = Math.round((baseSell * w * mintingMultiplier) / 1000) * 1000;
    const buybackPrice = Math.round((baseBuyback * w) / 1000) * 1000;
    return { weight: w, sellPrice, buybackPrice };
  });
}

function parseGaleri24Vendor(html, vendorId) {
  const idIdx = html.indexOf(`id="${vendorId}"`);
  if (idIdx === -1) return [];
  const sub = html.substring(idIdx, idIdx + 6500);
  const rowRegex = /<div class="[^"]*whitespace-nowrap[^"]*">([\d\.]+)<\/div>\s*<div class="[^"]*whitespace-nowrap[^"]*">(Rp[\d\.,]+)<\/div>\s*<div class="[^"]*whitespace-nowrap[^"]*">(Rp[\d\.,]+)<\/div>/gi;
  const list = [];
  const seenWeights = new Set();
  let m;
  while ((m = rowRegex.exec(sub)) !== null) {
    const w = parseFloat(m[1]);
    const sell = parseInt(m[2].replace(/[^\d]/g, ''), 10);
    const buyback = parseInt(m[3].replace(/[^\d]/g, ''), 10);
    if (!isNaN(w) && !isNaN(sell) && !isNaN(buyback) && !seenWeights.has(w)) {
      seenWeights.add(w);
      list.push({ weight: w, sellPrice: sell, buybackPrice: buyback });
    }
  }
  return list;
}

function parseHartadinata1g(html) {
  const match = html.match(/Harga EMASKU[\s\S]*?IDR\s*<span>([\d\.,]+)<\/span>/i);
  return match && match[1] ? parseInt(match[1].replace(/[^\d]/g, ''), 10) : null;
}

let cachedPriceData = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 menit

export async function getLiveOrCachedPrices(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedPriceData && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedPriceData;
  }

  let isLive = false;
  let parsedDate = null;
  let antamLive = [];
  let ubsLive = [];
  let g24Live = [];
  let hrta1g = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const [g24Res, hrtaRes] = await Promise.allSettled([
      fetch('https://galeri24.co.id/harga-emas', {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      }),
      fetch('https://hartadinataabadi.co.id', {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      })
    ]);
    clearTimeout(timeout);

    if (g24Res.status === 'fulfilled' && g24Res.value.ok) {
      const html = await g24Res.value.text();
      const dateMatch = html.match(/Diperbarui\s+([^<]+)/i);
      if (dateMatch && dateMatch[1]) parsedDate = dateMatch[1].trim();
      g24Live = parseGaleri24Vendor(html, 'GALERI 24');
      antamLive = parseGaleri24Vendor(html, 'ANTAM');
      ubsLive = parseGaleri24Vendor(html, 'UBS');
      if (antamLive.length > 0) isLive = true;
    }

    if (hrtaRes.status === 'fulfilled' && hrtaRes.value.ok) {
      const hrtaHtml = await hrtaRes.value.text();
      hrta1g = parseHartadinata1g(hrtaHtml);
    }
  } catch {
    // Resilient fallback to calibrated baseline
  }

  const resolveBrand = (liveFractions, defaultKey) => {
    const base = BASE_MARKET_RATES[defaultKey];
    const live1g = liveFractions.find((f) => f.weight === 1);
    const sell1g = live1g ? live1g.sellPrice : base.baseSell;
    const buyback1g = live1g ? live1g.buybackPrice : base.baseBuyback;
    const sourceFractions = liveFractions.length > 0
      ? liveFractions
      : calculateFractions(sell1g, buyback1g, base.fractions);

    const seenWeights = new Set();
    const fractions = sourceFractions.filter((f) => {
      if (!base.fractions.includes(f.weight) || seenWeights.has(f.weight)) return false;
      seenWeights.add(f.weight);
      return true;
    });

    return {
      id: defaultKey,
      name: base.name,
      basePricePerGram: sell1g,
      buybackPerGram: buyback1g,
      fractions
    };
  };

  const hrtaBaseSell = hrta1g || BASE_MARKET_RATES.hrta.baseSell;
  const hrtaBaseBuyback = Math.round((hrtaBaseSell * 0.92) / 1000) * 1000;

  const historyData = loadPriceHistory();

  // If live scraping failed, attempt to use yesterday's / latest saved real prices
  if (!isLive && historyData.latest && historyData.latest.brands) {
    const fallback = JSON.parse(JSON.stringify(historyData.latest));
    // Clean any legacy duplicate fractions
    for (const b of Object.values(fallback.brands || {})) {
      if (Array.isArray(b.fractions)) {
        const seen = new Set();
        b.fractions = b.fractions.filter((f) => {
          if (seen.has(f.weight)) return false;
          seen.add(f.weight);
          return true;
        });
      }
    }
    fallback.isLive = false;
    fallback.isHistoricalFallback = true;
    fallback.source = `Harga Riil Terakhir Tersimpan (${fallback.displayDate || 'Kemarin'})`;
    fallback.status = 'historical_fallback';
    fallback.history = Object.values(historyData.snapshots || {}).slice(-14);
    cachedPriceData = fallback;
    lastCacheTime = now;
    return fallback;
  }

  const result = {
    updatedAt: new Date().toISOString(),
    displayDate: parsedDate || 'Hari Ini',
    isLive,
    isHistoricalFallback: false,
    source: isLive ? 'Live Portal Resmi Pegadaian & Hartadinata' : 'Data Terkalibrasi Standar Pasar',
    status: isLive ? 'ok' : 'calibrated_fallback',
    history: Object.values(historyData.snapshots || {}).slice(-14),
    brands: {
      antam: resolveBrand(antamLive, 'antam'),
      ubs: resolveBrand(ubsLive, 'ubs'),
      galeri24: resolveBrand(g24Live, 'galeri24'),
      hrta: {
        id: 'hrta',
        name: BASE_MARKET_RATES.hrta.name,
        basePricePerGram: hrtaBaseSell,
        buybackPerGram: hrtaBaseBuyback,
        fractions: calculateFractions(hrtaBaseSell, hrtaBaseBuyback, BASE_MARKET_RATES.hrta.fractions)
      }
    }
  };

  if (isLive) {
    savePriceHistory(result);
    // Reload snapshots to include today's newly saved snapshot
    result.history = Object.values(loadPriceHistory().snapshots || {}).slice(-14);
  }

  cachedPriceData = result;
  lastCacheTime = now;
  return result;
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

export function serveStaticSafe(res, requestedPath, fallback = true) {
  const normalized = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  const target = path.resolve(DIST_DIR, normalized);
  const rel = path.relative(DIST_DIR, target);
  const isInsideDist = !rel.startsWith('..') && !path.isAbsolute(rel);

  if (!isInsideDist || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    if (fallback) {
      const indexHtml = path.join(DIST_DIR, 'index.html');
      if (fs.existsSync(indexHtml)) return serveStaticSafe(res, 'index.html', false);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not Found');
  }

  const ext = path.extname(target).toLowerCase();
  const headers = { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' };
  if (normalized === 'sw.js' || normalized.endsWith('/sw.js')) {
    headers['Service-Worker-Allowed'] = '/';
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  }
  res.writeHead(200, headers);
  const stream = fs.createReadStream(target);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('File Stream Error');
  });
  stream.pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    return res.end('Method Not Allowed');
  }

  if (url.pathname === '/api/prices') {
    try {
      const force = url.searchParams.get('refresh') === '1';
      const data = await getLiveOrCachedPrices(force);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Gagal memproses data harga' }));
    }
    return;
  }

  const reqFile = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  serveStaticSafe(res, reqFile);
});

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  server.listen(PORT, () => {
    console.log(`Keping Emas Server running at http://localhost:${PORT}`);
  });
}
