import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import CertiCard from './CertiCard';
import { haptic } from '../utils/haptics';

const BRANDS = [
  { id: 'antam', name: 'Antam LM' },
  { id: 'ubs', name: 'UBS Gold' },
  { id: 'galeri24', name: 'Galeri 24' },
  { id: 'hrta', name: 'HRTA Gold' },
  { id: 'other', name: 'Merek Lainnya...' }
];

const BENCHMARK_OPTIONS = [
  { id: 'antam', name: 'Antam' },
  { id: 'ubs', name: 'UBS' },
  { id: 'galeri24', name: 'Galeri 24' },
  { id: 'hrta', name: 'HRTA' }
];

const COMMON_WEIGHTS = [0.1, 0.5, 1, 2, 5, 10, 25, 50, 100];

export default function AddGoldSheet({
  isOpen,
  onClose,
  onSave,
  editItem = null,
  prices = null
}) {
  const [brand, setBrand] = useState('antam');
  const [customBrand, setCustomBrand] = useState('');
  const [benchmarkBrand, setBenchmarkBrand] = useState('antam');
  const [weight, setWeight] = useState(1);
  const [customWeight, setCustomWeight] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState(null);

  // Keyboard accessibility Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Mobile Swipe-to-Dismiss Touch Gestures
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (editItem) {
      const isKnown = ['antam', 'ubs', 'galeri24', 'hrta'].includes(editItem.brand?.toLowerCase());
      const itemBrand = isKnown ? editItem.brand : 'other';
      setBrand(itemBrand);
      setCustomBrand(editItem.customBrand || (!isKnown ? editItem.brand : ''));
      setBenchmarkBrand(editItem.benchmarkBrand || 'antam');
      setWeight(editItem.weight || 1);
      setCustomWeight(COMMON_WEIGHTS.includes(editItem.weight) ? '' : String(editItem.weight));
      setBuyPrice(String(editItem.buyPrice || ''));
      setBuyDate(editItem.buyDate || new Date().toISOString().split('T')[0]);
      setSerialNumber(editItem.serialNumber || '');
      setNotes(editItem.notes || '');
    } else {
      setBrand('antam');
      setCustomBrand('');
      setBenchmarkBrand('antam');
      setWeight(1);
      setCustomWeight('');
      setBuyPrice('');
      setBuyDate(new Date().toISOString().split('T')[0]);
      setSerialNumber('');
      setNotes('');
    }
    setTranslateY(0);
  }, [editItem, isOpen]);

  const autoFillCurrentPrice = () => {
    haptic('light');
    if (!prices || !prices.brands) return;
    const targetBrand = brand === 'other' ? benchmarkBrand : brand;
    const brandData = prices.brands[targetBrand];
    if (!brandData) return;

    const currentWeight = customWeight ? parseFloat(customWeight) : weight;
    const fraction = brandData.fractions.find((f) => Math.abs(f.weight - currentWeight) < 0.001);
    if (fraction) {
      setBuyPrice(String(fraction.sellPrice));
    } else {
      setBuyPrice(String(Math.round(currentWeight * brandData.basePricePerGram)));
    }
  };

  const activeWeight = customWeight ? parseFloat(customWeight) || 0 : weight;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeWeight <= 0) {
      setFormError('Berat emas harus lebih dari 0 gram');
      return;
    }
    const priceNum = parseInt(String(buyPrice).replace(/\D/g, ''), 10) || 0;
    setFormError(null);

    const brandPrefix = (
      brand === 'other'
        ? (customBrand.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || 'GOLD')
        : brand
    ).toUpperCase();

    onSave({
      brand,
      customBrand: brand === 'other' ? customBrand.trim().slice(0, 30) : '',
      benchmarkBrand: brand === 'other' ? benchmarkBrand : 'antam',
      weight: activeWeight,
      buyPrice: priceNum,
      buyDate: buyDate || new Date().toISOString().split('T')[0],
      serialNumber: serialNumber.trim() || `SN-${brandPrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: notes.trim()
    });
  };

  // Touch gesture handlers for swipe-down to dismiss
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateY > 100) {
      haptic('light');
      onClose();
    } else {
      setTranslateY(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editItem ? 'Edit Catatan Emas' : 'Catat Emas Baru'}
        className="w-full max-w-md bg-[#16181A] border-t border-[#26292D] rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 200ms ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swipe Handle & Header (Touch Area for Dismissing) */}
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

            <h2 className="text-sm font-semibold text-[#F4F5F6]">
              {editItem ? 'Edit Catatan Emas' : 'Catat Emas Baru'}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-end text-[#8B9097] hover:text-[#F4F5F6] active:scale-95"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {formError && (
            <div className="p-2.5 rounded-lg bg-[#F87171]/10 border border-[#F87171]/20 text-xs text-[#F87171]">
              {formError}
            </div>
          )}

          {/* CertiCard Preview */}
          <div className="flex flex-col items-center justify-center py-1">
            <CertiCard
              brand={brand}
              customBrand={customBrand}
              weight={activeWeight}
              serialNumber={serialNumber}
              size="sm"
            />
          </div>

          {/* 1. Brand Selection (44px min touch target) */}
          <div>
            <label className="block text-xs font-semibold text-[#8B9097] uppercase tracking-wider mb-1.5">
              Merek Emas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BRANDS.map((b) => {
                const isSelected = brand === b.id;
                const isOther = b.id === 'other';
                return (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => {
                      haptic('light');
                      setBrand(b.id);
                    }}
                    className={`min-h-[44px] rounded-lg border text-xs font-medium px-3 flex items-center justify-between transition-all ${
                      isOther ? 'col-span-2' : ''
                    } ${
                      isSelected
                        ? 'border-[#D4A346] bg-[#0C0D0E] text-[#F4F5F6] font-semibold'
                        : 'border-[#26292D] bg-[#0C0D0E]/60 text-[#8B9097] hover:text-[#F4F5F6]'
                    }`}
                  >
                    <span>{b.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#D4A346]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Brand Inputs (Conditional) */}
            {brand === 'other' && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#0C0D0E] border border-[#26292D] space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8B9097] mb-1">
                    Nama Merek / Produsen Emas
                  </label>
                  <input
                    type="text"
                    autoComplete="off"
                    maxLength={30}
                    placeholder="Contoh: Lotus Archi, PAMP, Dinar, Emas Lokal..."
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full min-h-[44px] bg-[#16181A] border border-[#26292D] rounded-lg px-3 text-xs text-[#F4F5F6] placeholder-[#565A61] focus:outline-none focus:border-[#D4A346]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <label className="text-xs font-semibold text-[#8B9097]">
                      Merek Acuan Valuasi Pasar
                    </label>
                    <span className="text-[10px] text-[#565A61]">Taksiran PnL</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BENCHMARK_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => {
                          haptic('light');
                          setBenchmarkBrand(opt.id);
                        }}
                        className={`min-h-[38px] rounded-lg border text-[11px] font-medium px-1 flex items-center justify-center transition-all ${
                          benchmarkBrand === opt.id
                            ? 'border-[#D4A346] bg-[#D4A346]/10 text-[#D4A346] font-semibold'
                            : 'border-[#26292D] bg-[#16181A] text-[#8B9097] hover:text-[#F4F5F6]'
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Weight Selection */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-xs font-semibold text-[#8B9097] uppercase tracking-wider">
                Berat Pecahan
              </label>
              <span className="text-xs font-semibold text-[#D4A346] tabular-nums">
                {activeWeight} gram
              </span>
            </div>
            {/* Quick Chips (Min 40px height) */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_WEIGHTS.map((w) => (
                <button
                  type="button"
                  key={w}
                  onClick={() => {
                    haptic('light');
                    setWeight(w);
                    setCustomWeight('');
                  }}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium border tabular-nums transition-all ${
                    !customWeight && weight === w
                      ? 'bg-[#D4A346] text-[#0C0D0E] border-[#D4A346] font-semibold'
                      : 'bg-[#0C0D0E] text-[#8B9097] border-[#26292D] hover:text-[#F4F5F6]'
                  }`}
                >
                  {w}g
                </button>
              ))}
            </div>
            {/* Custom Weight with decimal keypad inputMode */}
            <input
              type="text"
              aria-label="Berat emas kustom dalam gram"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              autoComplete="off"
              spellCheck="false"
              placeholder="Atau ketik gram kustom (misal: 0.25)..."
              value={customWeight}
              onChange={(e) => setCustomWeight(e.target.value.replace(',', '.'))}
              className="w-full min-h-[44px] bg-[#0C0D0E] border border-[#26292D] rounded-lg px-3 text-xs text-[#F4F5F6] placeholder-[#565A61] focus:outline-none focus:border-[#D4A346] tabular-nums"
            />
          </div>

          {/* 3. Buy Price (with numeric keypad inputMode) & Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-xs font-semibold text-[#8B9097]">Harga Beli</label>
                <button
                  type="button"
                  onClick={autoFillCurrentPrice}
                  className="text-[11px] text-[#D4A346] hover:underline"
                >
                  Harga Pasar
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs text-[#565A61] font-mono">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  required
                  placeholder="0"
                  value={buyPrice ? Number(buyPrice.replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                  onChange={(e) => setBuyPrice(e.target.value.replace(/\D/g, ''))}
                  className="w-full min-h-[44px] bg-[#0C0D0E] border border-[#26292D] rounded-lg pl-8 pr-3 text-xs text-[#F4F5F6] placeholder-[#565A61] focus:outline-none focus:border-[#D4A346] font-mono tabular-nums font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8B9097] mb-1">Tanggal</label>
              <input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                className="w-full min-h-[44px] bg-[#0C0D0E] border border-[#26292D] rounded-lg px-3 text-xs text-[#F4F5F6] focus:outline-none focus:border-[#D4A346]"
              />
            </div>
          </div>

          {/* 4. Serial & Notes */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#8B9097] mb-1">
                Nomor Seri
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder="Opsional..."
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full min-h-[44px] bg-[#0C0D0E] border border-[#26292D] rounded-lg px-3 text-xs text-[#F4F5F6] placeholder-[#565A61] focus:outline-none focus:border-[#D4A346]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8B9097] mb-1">
                Catatan
              </label>
              <input
                type="text"
                placeholder="Contoh: Tabungan"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[44px] bg-[#0C0D0E] border border-[#26292D] rounded-lg px-3 text-xs text-[#F4F5F6] placeholder-[#565A61] focus:outline-none focus:border-[#D4A346]"
              />
            </div>
          </div>

          {/* Primary CTA Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] bg-[#D4A346] hover:bg-[#C29235] text-[#0C0D0E] font-semibold rounded-xl text-sm active:scale-[0.98] transition-all"
            >
              {editItem ? 'Simpan Perubahan' : 'Simpan ke Portofolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
