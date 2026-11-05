import React, { useState } from 'react';
import { RefreshCw, ExternalLink, History, Scale } from 'lucide-react';

const BRAND_TABS = [
  { id: 'antam', name: 'Antam LM', badge: 'PT Aneka Tambang Tbk', source: 'logammulia.com' },
  { id: 'ubs', name: 'UBS Gold', badge: 'PT Untung Bersama Sejahtera', source: 'ubslifestyle.com' },
  { id: 'galeri24', name: 'Galeri 24', badge: 'Pegadaian Group', source: 'galeri24.co.id' },
  { id: 'hrta', name: 'HRTA Gold', badge: 'PT Hartadinata Abadi Tbk', source: 'emasku.co.id' }
];

export default function PricesView({ prices, isLoading, onRefresh, priceError, onOpenZakat }) {
  const [selectedBrand, setSelectedBrand] = useState('antam');

  const formatRp = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');

  const brandData = prices?.brands?.[selectedBrand];
  const brandMeta = BRAND_TABS.find((b) => b.id === selectedBrand);

  const baseSell = brandData?.basePricePerGram || 0;
  const baseBuyback = brandData?.buybackPerGram || 0;
  const spread = baseSell - baseBuyback;

  return (
    <div className="space-y-4 pb-28">
      {/* Top Header */}
      <header className="flex justify-between items-center pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-[#F4F5F6] tracking-tight">
              Harga Pasar Hari Ini
            </h1>
            {prices?.isLive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                LIVE RESMI
              </span>
            ) : (prices?.isHistoricalFallback || prices?.isOffline) ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                TERSIMPAN (OFFLINE)
              </span>
            ) : null}
          </div>
          <p className="text-xs text-[#8B9097]">
            {prices?.displayDate || 'Update Harian'}
          </p>
        </div>

        <button
          onClick={() => onRefresh(true)}
          disabled={isLoading}
          className={`h-8 w-8 rounded-lg border border-[#26292D] bg-[#16181A] text-[#8B9097] hover:text-[#F4F5F6] flex items-center justify-center active:scale-95 transition-all ${
            isLoading ? 'opacity-50 animate-spin' : ''
          }`}
          title="Perbarui Harga"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Brand Switcher Segmented Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#16181A] border border-[#26292D]">
        {BRAND_TABS.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBrand(b.id)}
            className={`py-2 text-xs font-medium rounded-lg transition-all ${
              selectedBrand === b.id
                ? 'bg-[#26292D] text-[#F4F5F6] font-semibold'
                : 'text-[#8B9097] hover:text-[#F4F5F6]'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* 1 Gram Anchor Metric Spotlight */}
      <section className="p-4 rounded-xl border border-[#26292D] bg-[#16181A] space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-[#8B9097]">{brandMeta?.badge}</span>
          <span className="text-[11px] text-[#565A61] font-mono">Pecahan 1 Gram</span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <span className="text-xs text-[#8B9097] block mb-0.5">Harga Jual Resmi</span>
            <span className="text-lg font-semibold text-[#F4F5F6] tabular-nums">
              {formatRp(baseSell)}
            </span>
          </div>

          <div>
            <span className="text-xs text-[#8B9097] block mb-0.5">Harga Buyback</span>
            <span className="text-lg font-semibold text-[#D4A346] tabular-nums">
              {formatRp(baseBuyback)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#26292D] flex justify-between items-center text-xs text-[#8B9097]">
          <span>Selisih (Spread):</span>
          <span className="tabular-nums font-medium text-[#F4F5F6]">{formatRp(spread)}</span>
        </div>
      </section>

      {/* Zakat Emas Calculator Action Card */}
      <button
        type="button"
        onClick={onOpenZakat}
        className="w-full text-left p-3.5 rounded-xl border border-[#26292D] bg-[#16181A] hover:border-[#D4A346]/40 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0C0D0E] border border-[#26292D] flex items-center justify-center text-[#D4A346]">
            <Scale className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-[#F4F5F6]">Kalkulator Zakat Emas</h2>
            <p className="text-[11px] text-[#8B9097]">
              Hitung nisab 85g & kadar 2.5% berdasar harga hari ini
            </p>
          </div>
        </div>

        <span className="h-8 px-3 rounded-lg border border-[#26292D] bg-[#0C0D0E] text-xs font-semibold text-[#D4A346] flex items-center">
          Hitung
        </span>
      </button>

      {/* Financial Terminal Table */}
      <section className="rounded-xl border border-[#26292D] bg-[#16181A] overflow-hidden">
        <div className="grid grid-cols-3 p-3 text-[11px] font-semibold text-[#8B9097] border-b border-[#26292D] bg-[#0C0D0E]/50">
          <span>Pecahan</span>
          <span className="text-right">Harga Jual</span>
          <span className="text-right">Buyback</span>
        </div>

        <div className="divide-y divide-[#26292D]">
          {brandData?.fractions?.map((f, idx) => (
            <div
              key={`${selectedBrand}-${f.weight}-${idx}`}
              className="grid grid-cols-3 p-3 text-xs tabular-nums items-center hover:bg-[#26292D]/20 transition-colors"
            >
              <span className="font-semibold text-[#F4F5F6]">{f.weight} gram</span>
              <span className="text-right text-[#F4F5F6]">{formatRp(f.sellPrice)}</span>
              <span className="text-right text-[#D4A346] font-medium">{formatRp(f.buybackPrice)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Price History Section */}
      {prices?.history && prices.history.length > 0 && (
        <section className="rounded-xl border border-[#26292D] bg-[#16181A] p-3.5 space-y-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F4F5F6]">
              <History className="w-3.5 h-3.5 text-[#D4A346]" />
              <span>Riwayat Harga 1g Terakhir</span>
            </div>
            <span className="text-[11px] text-[#8B9097]">{prices.history.length} catatan</span>
          </div>

          <div className="divide-y divide-[#26292D] text-xs tabular-nums">
            {prices.history.slice().reverse().map((h, idx) => {
              const bData = h.brands?.[selectedBrand];
              if (!bData) return null;
              return (
                <div key={h.date || idx} className="py-2 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[#F4F5F6] font-medium block">{h.displayDate || h.date}</span>
                    <span className="text-[10px] text-[#8B9097]">Beli: {formatRp(bData.sell)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#D4A346]">{formatRp(bData.buyback)}</span>
                    <span className="text-[10px] text-[#8B9097] block">Buyback</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Source attribution footer */}
      <footer className="text-[11px] text-[#565A61] pt-1 space-y-1">
        <div className="flex items-center gap-1 text-[#8B9097] font-medium">
          <ExternalLink className="w-3 h-3" />
          Sumber Resmi Terverifikasi:
        </div>
        <p>• Antam, UBS, Galeri 24: PT Galeri 24 (Pegadaian Group)</p>
        <p>• HRTA Gold: PT Hartadinata Abadi Tbk (EMASKU®)</p>
      </footer>
    </div>
  );
}
