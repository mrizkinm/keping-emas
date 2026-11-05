import { useState, useEffect, useMemo, useCallback } from 'react';

const STORAGE_KEY = 'brankas_emas_items_v1';
const PIN_HASH_KEY = 'brankas_emas_pinhash_v1';
export const THEME_KEY = 'brankas_emas_theme_v1';
export const HIDE_NOMINAL_KEY = 'brankas_emas_hide_nominal_v1';
export const LAST_PRICES_KEY = 'brankas_emas_last_prices_v1';
export const PRICE_HISTORY_KEY = 'brankas_emas_price_history_v1';

export const NISAB_GRAMS = 85;
export const ZAKAT_RATE = 0.025; // 2.5% (1/40 standar BAZNAS & PMA No. 52/2014)

export function calculateGoldZakat(totalGrams, pricePerGram = 0) {
  const grams = Math.max(0, Math.round((parseFloat(totalGrams) || 0) * 1000) / 1000);
  const isNisabReached = grams >= NISAB_GRAMS;
  const zakatGrams = isNisabReached ? Math.round(grams * ZAKAT_RATE * 1000) / 1000 : 0;
  const zakatNominalRp = Math.round(zakatGrams * (parseFloat(pricePerGram) || 0));
  const remainingToNisab = isNisabReached ? 0 : Math.round((NISAB_GRAMS - grams) * 1000) / 1000;
  const progressPercent = Math.min(100, Math.round((grams / NISAB_GRAMS) * 1000) / 10);

  return {
    grams,
    isNisabReached,
    zakatGrams,
    zakatNominalRp,
    remainingToNisab,
    progressPercent
  };
}

// Safe UUID helper that works on both secure (HTTPS/localhost) and non-secure LAN contexts
export function generateItemId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return 'item-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8);
  }
  return 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

// Web Crypto native SHA-256 hash helper with application salt
export async function hashPin(pinString) {
  if (!pinString) return null;
  const PIN_SALT = 'keping-emas-pin-salt-v1:';
  const encoded = new TextEncoder().encode(PIN_SALT + String(pinString));
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Strict schema validation for backup JSON
export function validateAndSanitizeItems(list) {
  if (!Array.isArray(list)) return null;
  const valid = list
    .filter((it) => (
      it &&
      typeof it === 'object' &&
      typeof it.brand === 'string' &&
      ['antam', 'ubs', 'galeri24', 'hrta', 'other'].includes(it.brand.toLowerCase()) &&
      Number.isFinite(parseFloat(it.weight)) &&
      parseFloat(it.weight) > 0 &&
      Number.isFinite(parseInt(it.buyPrice, 10)) &&
      parseInt(it.buyPrice, 10) >= 0
    ))
    .map((it) => ({
      id: String(it.id || generateItemId()),
      brand: it.brand.toLowerCase(),
      customBrand: it.customBrand ? String(it.customBrand).trim().slice(0, 30) : '',
      benchmarkBrand: ['antam', 'ubs', 'galeri24', 'hrta'].includes(String(it.benchmarkBrand).toLowerCase())
        ? String(it.benchmarkBrand).toLowerCase()
        : 'antam',
      weight: Math.round(parseFloat(it.weight) * 1000) / 1000,
      buyPrice: Math.round(parseInt(it.buyPrice, 10)),
      buyDate: String(it.buyDate || new Date().toISOString().split('T')[0]).slice(0, 10),
      serialNumber: String(it.serialNumber || '').slice(0, 50),
      notes: String(it.notes || '').slice(0, 100)
    }));

  return valid.length > 0 ? valid : null;
}

const DEFAULT_ITEMS = [
  {
    id: 'item-1',
    brand: 'antam',
    weight: 10,
    buyPrice: 24000000,
    buyDate: '2025-10-15',
    serialNumber: 'LM-99281',
    notes: 'Investasi Jangka Panjang'
  },
  {
    id: 'item-2',
    brand: 'ubs',
    weight: 5,
    buyPrice: 12000000,
    buyDate: '2026-01-20',
    serialNumber: 'UBS-7712',
    notes: 'Tabungan Darurat'
  },
  {
    id: 'item-3',
    brand: 'hrta',
    weight: 1,
    buyPrice: 2380000,
    buyDate: '2026-03-05',
    serialNumber: 'HRT-3301',
    notes: 'Kado Emas Batangan'
  }
];

export function useGoldData() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const sanitized = validateAndSanitizeItems(JSON.parse(saved));
        if (sanitized) return sanitized;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ITEMS;
  });

  const [pinHash, setPinHash] = useState(() => {
    try {
      return localStorage.getItem(PIN_HASH_KEY) || null;
    } catch {
      return null;
    }
  });

  const [isLocked, setIsLocked] = useState(() => {
    try {
      return Boolean(localStorage.getItem(PIN_HASH_KEY));
    } catch {
      return false;
    }
  });

  const [prices, setPrices] = useState(() => {
    try {
      const saved = localStorage.getItem(LAST_PRICES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.brands) return parsed;
      }
    } catch {
      // fallback
    }
    return null;
  });
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState(null);

  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved && ['dark', 'light', 'system'].includes(saved)) return saved;
    } catch {
      // fallback
    }
    return 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen to OS system color-scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemIsDark(e.matches);
    if (media.addEventListener) {
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
  }, []);

  const effectiveTheme = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;

  // Apply theme to HTML attribute and meta theme-color
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', effectiveTheme);
    root.classList.toggle('dark', effectiveTheme === 'dark');

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#0C0D0E' : '#F6F7F9');
    }
  }, [effectiveTheme]);

  const setTheme = useCallback((newTheme) => {
    if (!['dark', 'light', 'system'].includes(newTheme)) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = effectiveTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [effectiveTheme, setTheme]);

  const [hideNominal, setHideNominalState] = useState(() => {
    try {
      return localStorage.getItem(HIDE_NOMINAL_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleHideNominal = useCallback(() => {
    setHideNominalState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(HIDE_NOMINAL_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const fetchPrices = useCallback(async (force = false) => {
    setIsLoadingPrices(true);
    setPriceError(null);
    try {
      const res = await fetch(`/api/prices${force ? '?refresh=1' : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPrices(data);
      try {
        localStorage.setItem(LAST_PRICES_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    } catch {
      // Offline / network failure: attempt to recover last cached real prices from localStorage
      try {
        const saved = localStorage.getItem(LAST_PRICES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.brands) {
            setPriceError(`Mode Offline / Menggunakan harga tersimpan (${parsed.displayDate || 'Terakhir'})`);
            setPrices({
              ...parsed,
              isLive: false,
              isOffline: true,
              status: 'offline_cached'
            });
            setIsLoadingPrices(false);
            return;
          }
        }
      } catch {
        // ignore
      }

      setPriceError('Mode Offline / Menggunakan harga acuan lokal');
      setPrices({
        updatedAt: new Date().toISOString(),
        displayDate: 'Hari Ini',
        isLive: false,
        status: 'offline_fallback',
        brands: {
          antam: {
            id: 'antam',
            name: 'Antam LM',
            basePricePerGram: 2576000,
            buybackPerGram: 2293000,
            fractions: [
              { weight: 0.5, sellPrice: 1339000, buybackPrice: 1146000 },
              { weight: 1, sellPrice: 2576000, buybackPrice: 2293000 },
              { weight: 2, sellPrice: 5092000, buybackPrice: 4586000 },
              { weight: 3, sellPrice: 7613000, buybackPrice: 6879000 },
              { weight: 5, sellPrice: 12620000, buybackPrice: 11465000 },
              { weight: 10, sellPrice: 25185000, buybackPrice: 22930000 },
              { weight: 25, sellPrice: 62837000, buybackPrice: 57325000 },
              { weight: 50, sellPrice: 125595000, buybackPrice: 114650000 },
              { weight: 100, sellPrice: 251112000, buybackPrice: 229300000 }
            ]
          },
          ubs: {
            id: 'ubs',
            name: 'UBS Gold',
            basePricePerGram: 2519000,
            buybackPerGram: 2293000,
            fractions: [
              { weight: 0.5, sellPrice: 1362000, buybackPrice: 1146000 },
              { weight: 1, sellPrice: 2519000, buybackPrice: 2293000 },
              { weight: 2, sellPrice: 4995000, buybackPrice: 4586000 },
              { weight: 5, sellPrice: 12355000, buybackPrice: 11465000 },
              { weight: 10, sellPrice: 24590000, buybackPrice: 22930000 },
              { weight: 25, sellPrice: 61340000, buybackPrice: 57325000 },
              { weight: 50, sellPrice: 122450000, buybackPrice: 114650000 },
              { weight: 100, sellPrice: 244670000, buybackPrice: 229300000 }
            ]
          },
          galeri24: {
            id: 'galeri24',
            name: 'Galeri 24',
            basePricePerGram: 2463000,
            buybackPerGram: 2318000,
            fractions: [
              { weight: 0.5, sellPrice: 1292000, buybackPrice: 1156000 },
              { weight: 1, sellPrice: 2463000, buybackPrice: 2318000 },
              { weight: 2, sellPrice: 4866000, buybackPrice: 4627000 },
              { weight: 5, sellPrice: 12074000, buybackPrice: 11568000 },
              { weight: 10, sellPrice: 24084000, buybackPrice: 23136000 },
              { weight: 25, sellPrice: 59885000, buybackPrice: 57555000 },
              { weight: 50, sellPrice: 119675000, buybackPrice: 115111000 },
              { weight: 100, sellPrice: 239232000, buybackPrice: 230223000 }
            ]
          },
          hrta: {
            id: 'hrta',
            name: 'HRTA Gold (EMASKU)',
            basePricePerGram: 2408000,
            buybackPerGram: 2215000,
            fractions: [
              { weight: 0.1, sellPrice: 301000, buybackPrice: 221500 },
              { weight: 0.25, sellPrice: 692000, buybackPrice: 553750 },
              { weight: 0.5, sellPrice: 1288000, buybackPrice: 1107500 },
              { weight: 1, sellPrice: 2408000, buybackPrice: 2215000 },
              { weight: 2, sellPrice: 4719000, buybackPrice: 4430000 },
              { weight: 5, sellPrice: 11678000, buybackPrice: 11075000 },
              { weight: 10, sellPrice: 23261000, buybackPrice: 22150000 },
              { weight: 25, sellPrice: 57943000, buybackPrice: 55375000 },
              { weight: 50, sellPrice: 115684000, buybackPrice: 110750000 },
              { weight: 100, sellPrice: 231168000, buybackPrice: 221500000 }
            ]
          }
        }
      });
    } finally {
      setIsLoadingPrices(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const addItem = (newItem) => {
    const item = {
      ...newItem,
      id: generateItemId()
    };
    setItems((prev) => [item, ...prev]);
    return item;
  };

  const updateItem = (id, updatedFields) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    );
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllItems = () => {
    setItems([]);
  };

  const importItems = (newItemsList) => {
    const sanitized = validateAndSanitizeItems(newItemsList);
    if (sanitized) {
      setItems(sanitized);
      return true;
    }
    return false;
  };

  const setAppPin = async (newPlainPin) => {
    if (newPlainPin) {
      const hash = await hashPin(newPlainPin);
      localStorage.setItem(PIN_HASH_KEY, hash);
      setPinHash(hash);
    } else {
      localStorage.removeItem(PIN_HASH_KEY);
      setPinHash(null);
      setIsLocked(false);
    }
  };

  const verifyAndUnlock = async (enteredPlainPin) => {
    if (!pinHash) {
      setIsLocked(false);
      return true;
    }
    const enteredHash = await hashPin(enteredPlainPin);
    if (enteredHash === pinHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (pinHash) setIsLocked(true);
  };

  const getItemCurrentValue = useCallback((item) => {
    if (!prices || !prices.brands) return { sellPrice: item.buyPrice, buybackPrice: item.buyPrice };
    const rawBrand = String(item.brand || '').toLowerCase();
    const benchmarkKey = item.benchmarkBrand ? String(item.benchmarkBrand).toLowerCase() : 'antam';
    const brandKey = rawBrand === 'other' ? benchmarkKey : rawBrand;
    const brandData = prices.brands[brandKey];
    if (!brandData) {
      const fallbackPerGram = prices.brands.antam?.buybackPerGram || 2293000;
      return {
        sellPrice: item.weight * (prices.brands.antam?.basePricePerGram || 2576000),
        buybackPrice: item.weight * fallbackPerGram
      };
    }

    const fraction = brandData.fractions.find((f) => Math.abs(f.weight - item.weight) < 0.001);
    if (fraction) {
      return {
        sellPrice: fraction.sellPrice,
        buybackPrice: fraction.buybackPrice
      };
    }

    return {
      sellPrice: Math.round(item.weight * brandData.basePricePerGram),
      buybackPrice: Math.round(item.weight * brandData.buybackPerGram)
    };
  }, [prices]);

  const portfolio = useMemo(() => {
    let totalGrams = 0;
    let totalInvested = 0;
    let totalCurrentMarketValue = 0;
    let totalCurrentBuybackValue = 0;

    const enrichedItems = items.map((item) => {
      const val = getItemCurrentValue(item);
      const itemGrams = parseFloat(item.weight) || 0;
      const itemInvested = parseFloat(item.buyPrice) || 0;

      totalGrams += itemGrams;
      totalInvested += itemInvested;
      totalCurrentMarketValue += val.sellPrice;
      totalCurrentBuybackValue += val.buybackPrice;

      const pnlRp = val.buybackPrice - itemInvested;
      const pnlPercent = itemInvested > 0 ? (pnlRp / itemInvested) * 100 : 0;

      return {
        ...item,
        currentSellPrice: val.sellPrice,
        currentBuybackPrice: val.buybackPrice,
        pnlRp,
        pnlPercent
      };
    });

    const totalPnlRp = totalCurrentBuybackValue - totalInvested;
    const totalPnlPercent = totalInvested > 0 ? (totalPnlRp / totalInvested) * 100 : 0;

    return {
      totalGrams: Math.round(totalGrams * 1000) / 1000,
      totalCount: items.length,
      totalInvested,
      totalCurrentMarketValue,
      totalCurrentBuybackValue,
      totalPnlRp,
      totalPnlPercent,
      items: enrichedItems
    };
  }, [items, getItemCurrentValue]);

  return {
    items: portfolio.items,
    portfolio,
    prices,
    isLoadingPrices,
    priceError,
    fetchPrices,
    addItem,
    updateItem,
    deleteItem,
    clearAllItems,
    importItems,
    hasPin: Boolean(pinHash),
    isLocked,
    setAppPin,
    verifyAndUnlock,
    lockApp,
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    hideNominal,
    toggleHideNominal
  };
}
