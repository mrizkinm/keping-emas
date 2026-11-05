import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  ChevronDown,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Coins,
  SlidersHorizontal
} from 'lucide-react';
import { NISAB_GRAMS, ZAKAT_RATE, calculateGoldZakat } from '../hooks/useGoldData';
import { haptic } from '../utils/haptics';

const BRAND_OPTIONS = [
  { id: 'antam', name: 'Antam LM' },
  { id: 'ubs', name: 'UBS Gold' },
  { id: 'galeri24', name: 'Galeri 24' },
  { id: 'hrta', name: 'HRTA (EMASKU)' }
];

export default function ZakatSheet({
  isOpen,
  onClose,
  portfolio,
  prices,
  hideNominal = false
}) {
  const [calcMode, setCalcMode] = useState('portfolio'); // 'portfolio' | 'custom'
  const [customGramsInput, setCustomGramsInput] = useState('');
  const [haulOnly, setHaulOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('antam');
  const [priceType, setPriceType] = useState('buyback'); // 'buyback' | 'sell'

  // Touch gesture state for swipe down dismissal
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);
  const currentTranslateY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      setTranslateY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentTranslateY.current > 120) {
      haptic('light');
      onClose();
    }
    setTranslateY(0);
    currentTranslateY.current = 0;
  };

  // Filter items that meet haul (purchased >= 1 year ago: 365 days)
  const haulItems = useMemo(() => {
    if (!portfolio?.items) return [];
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const cutoffStr = oneYearAgo.toISOString().split('T')[0];

    return portfolio.items.filter((item) => item.buyDate && item.buyDate <= cutoffStr);
  }, [portfolio?.items]);

  const portfolioHaulGrams = useMemo(() => {
    return Math.round(haulItems.reduce((acc, it) => acc + (parseFloat(it.weight) || 0), 0) * 1000) / 1000;
  }, [haulItems]);

  const activeGrams = useMemo(() => {
    if (calcMode === 'custom') {
      return Math.max(0, parseFloat(customGramsInput) || 0);
    }
    return haulOnly ? portfolioHaulGrams : (portfolio?.totalGrams || 0);
  }, [calcMode, customGramsInput, haulOnly, portfolioHaulGrams, portfolio?.totalGrams]);

  // Selected price per gram
  const activePricePerGram = useMemo(() => {
    const brandData = prices?.brands?.[selectedBrand];
    if (!brandData) return 2300000;
    return priceType === 'buyback'
      ? (brandData.buybackPerGram || 2300000)
      : (brandData.basePricePerGram || 2500000);
  }, [prices?.brands, selectedBrand, priceType]);

  const zakatResult = useMemo(() => {
    return calculateGoldZakat(activeGrams, activePricePerGram);
  }, [activeGrams, activePricePerGram]);

  const formatRp = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
  const formatVal = (num) => (hideNominal ? 'Rp ••••••••' : formatRp(num));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Kalkulator Zakat Emas"
        className="w-full max-w-md bg-[#16181A] border-t border-[#26292D] rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 200ms ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swipe Handle & Header */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-2 px-4 flex flex-col items-center border-b border-[#26292D] cursor-grab active:cursor-grabbing select-none"
        >
          <div className="w-10 h-1 bg-[#26292D] rounded-full mb-2" />
          <div className="w-full flex items-center justify-between min-h-[44px]">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-start text-[#8B9097] hover:text-[#F4F5F6] active:scale-95"
              title="Kembali / Tutup"
            >
              <ChevronDown className="w-5 h-5 stroke-[2]" />
            </button>

            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#D4A346]" />
              <h2 className="text-sm font-semibold text-[#F4F5F6]">Kalkulator Zakat Emas</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-end text-[#8B9097] hover:text-[#F4F5F6] active:scale-95"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Mode Switcher: Portofolio vs Simulasi Bebas */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0C0D0E] border border-[#26292D]">
            <button
              type="button"
              onClick={() => {
                haptic('light');
                setCalcMode('portfolio');
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                calcMode === 'portfolio'
                  ? 'bg-[#16181A] text-[#D4A346] font-semibold border border-[#26292D] shadow'
                  : 'text-[#8B9097] hover:text-[#F4F5F6]'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Portofolio ({portfolio?.totalGrams || 0}g)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic('light');
                setCalcMode('custom');
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                calcMode === 'custom'
                  ? 'bg-[#16181A] text-[#D4A346] font-semibold border border-[#26292D] shadow'
                  : 'text-[#8B9097] hover:text-[#F4F5F6]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Simulasi Bebas</span>
            </button>
          </div>

          {/* Mode: Portfolio Options */}
          {calcMode === 'portfolio' ? (
            <div className="p-3.5 rounded-xl border border-[#26292D] bg-[#0C0D0E]/60 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#F4F5F6] block">Hanya Emas yang Sudah Haul</span>
                  <span className="text-[11px] text-[#8B9097]">Telah tersimpan &ge; 1 tahun ({haulItems.length} keping, {portfolioHaulGrams}g)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    haptic('light');
                    setHaulOnly(!haulOnly);
                  }}
                  className={`min-w-[44px] h-6 rounded-full transition-colors relative p-0.5 flex items-center ${
                    haulOnly ? 'bg-[#D4A346]' : 'bg-[#26292D]'
                  }`}
                  aria-label="Filter haul satu tahun"
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-[#0C0D0E] transition-transform ${
                      haulOnly ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ) : (
            /* Mode: Custom Input */
            <div className="space-y-2">
              <label htmlFor="zakat-custom-grams" className="block text-xs font-semibold text-[#8B9097] uppercase tracking-wider">
                Berat Emas yang Dihitung
              </label>
              <div className="relative">
                <input
                  id="zakat-custom-grams"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={customGramsInput}
                  onChange={(e) => setCustomGramsInput(e.target.value)}
                  className="w-full min-h-[44px] bg-[#0C0D0E] border border-[#26292D] rounded-lg pl-3 pr-16 text-sm text-[#F4F5F6] placeholder-[#565A61] focus:outline-none focus:border-[#D4A346] tabular-nums"
                  autoFocus
                />
                <span className="absolute right-3 top-3 text-xs text-[#8B9097] font-medium">gram</span>
              </div>

              {/* Quick Preset Grams Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[50, 85, 100, 200, 500].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      haptic('light');
                      setCustomGramsInput(String(g));
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border border-[#26292D] bg-[#0C0D0E] tabular-nums transition-all ${
                      parseFloat(customGramsInput) === g
                        ? 'border-[#D4A346] text-[#D4A346] font-semibold'
                        : 'text-[#8B9097] hover:text-[#F4F5F6]'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Basis & Brand Selector */}
          <div className="p-3.5 rounded-xl border border-[#26292D] bg-[#0C0D0E]/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8B9097] uppercase tracking-wider">
                Patokan Harga Konversi
              </span>
              <span className="text-[11px] text-[#D4A346] font-mono tabular-nums">
                {formatRp(activePricePerGram)}/g
              </span>
            </div>

            {/* Type: Buyback vs Sell */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#16181A] border border-[#26292D] text-xs">
              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  setPriceType('buyback');
                }}
                className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                  priceType === 'buyback'
                    ? 'bg-[#26292D] text-[#D4A346] font-semibold shadow'
                    : 'text-[#8B9097] hover:text-[#F4F5F6]'
                }`}
              >
                Buyback (Likuidasi Riil)
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  setPriceType('sell');
                }}
                className={`py-1.5 px-2 rounded-md font-medium transition-all ${
                  priceType === 'sell'
                    ? 'bg-[#26292D] text-[#D4A346] font-semibold shadow'
                    : 'text-[#8B9097] hover:text-[#F4F5F6]'
                }`}
              >
                Harga Pasar (Jual Resmi)
              </button>
            </div>

            {/* Brand Pills */}
            <div className="grid grid-cols-4 gap-1">
              {BRAND_OPTIONS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    haptic('light');
                    setSelectedBrand(b.id);
                  }}
                  className={`py-1 text-[11px] font-medium rounded-md border text-center transition-all ${
                    selectedBrand === b.id
                      ? 'border-[#D4A346] bg-[#16181A] text-[#F4F5F6] font-semibold'
                      : 'border-[#26292D] bg-[#0C0D0E] text-[#8B9097] hover:text-[#F4F5F6]'
                  }`}
                >
                  {b.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Calculation Output Box */}
          <div className="p-4 rounded-xl border border-[#26292D] bg-[#0C0D0E] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#8B9097]">
                Status Kewajiban Zakat
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  zakatResult.isNisabReached
                    ? 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/30'
                    : 'bg-[#D4A346]/10 text-[#D4A346] border-[#D4A346]/30'
                }`}
              >
                {zakatResult.isNisabReached ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    WAJIB ZAKAT
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    BELUM NISAB
                  </>
                )}
              </span>
            </div>

            {/* Nisab Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs tabular-nums">
                <span className="text-[#8B9097]">
                  Gramasi Dihitung: <strong className="text-[#F4F5F6]">{zakatResult.grams}g</strong>
                </span>
                <span className="text-[#8B9097]">
                  Nisab: <strong className="text-[#F4F5F6]">{NISAB_GRAMS}g</strong>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#16181A] border border-[#26292D] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    zakatResult.isNisabReached ? 'bg-[#34D399]' : 'bg-[#D4A346]'
                  }`}
                  style={{ width: `${zakatResult.progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-[#8B9097]">
                {zakatResult.isNisabReached
                  ? `Nisab 85g telah terpenuhi (${zakatResult.progressPercent}%).`
                  : `Kurang ${zakatResult.remainingToNisab} gram lagi untuk mencapai nisab.`}
              </p>
            </div>

            {/* Valuation Results */}
            <div className="pt-3 border-t border-[#26292D] grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-[#8B9097] block mb-0.5">Kadar Zakat (2.5%)</span>
                <span className="text-base font-semibold text-[#F4F5F6] tabular-nums">
                  {zakatResult.isNisabReached ? `${zakatResult.zakatGrams} g` : '0 g'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#8B9097] block mb-0.5">Konversi Rupiah</span>
                <span className="text-base font-semibold text-[#D4A346] tabular-nums">
                  {zakatResult.isNisabReached ? formatVal(zakatResult.zakatNominalRp) : 'Rp 0'}
                </span>
              </div>
            </div>
          </div>

          {/* Syariah Reference Footer */}
          <div className="p-3 rounded-lg border border-[#26292D] bg-[#16181A]/50 text-[11px] text-[#8B9097] space-y-1">
            <div className="flex items-center gap-1.5 text-[#F4F5F6] font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-[#D4A346]" />
              <span>Dasar Hukum & Ketentuan Syariat:</span>
            </div>
            <p>• <strong>Nisab:</strong> 85 gram emas murni (24 Karat).</p>
            <p>• <strong>Haul:</strong> Telah dimiliki/tersimpan selama 1 tahun penuh.</p>
            <p>• <strong>Kadar Zakat:</strong> 2.5% (1/40) berdasarkan PMA No. 52/2014 & Fatwa MUI.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
