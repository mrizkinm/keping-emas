import React from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Lock,
  ChevronRight,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';
import CertiCard from '../components/CertiCard';

export default function DashboardView({
  portfolio,
  prices,
  isLoadingPrices,
  onRefreshPrices,
  onOpenAdd,
  onSelectTab,
  hasPin,
  onLockApp,
  effectiveTheme,
  onToggleTheme,
  hideNominal = false,
  onToggleHideNominal
}) {
  const formatRp = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
  const formatVal = (num) => hideNominal ? 'Rp ••••••••' : formatRp(num);
  const isProfit = portfolio.totalPnlRp >= 0;

  return (
    <div className="space-y-6 pb-28">
      {/* 1. Header (Quiet & Uncluttered) */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-base font-semibold text-[#F4F5F6] tracking-tight">
            Portofolio Emas
          </h1>
          <p className="text-xs text-[#8B9097] flex items-center gap-1">
            <span>{prices?.displayDate || 'Data Terkalibrasi'}</span>
            {(prices?.isHistoricalFallback || prices?.isOffline) && (
              <span className="text-[10px] text-[#38BDF8] font-mono">• Riwayat Tersimpan</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Status indicator */}
          <button
            type="button"
            onClick={() => onRefreshPrices(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#26292D] bg-[#16181A] text-[11px] text-[#8B9097] cursor-pointer active:scale-95 transition-all"
            title={prices?.source || "Klik untuk sinkronisasi harga live"}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                prices?.isLive
                  ? 'bg-[#34D399] animate-pulse'
                  : (prices?.isHistoricalFallback || prices?.isOffline)
                  ? 'bg-[#38BDF8]'
                  : 'bg-[#D4A346]'
              }`}
            />
            <span className="font-medium text-[#F4F5F6]">
              {isLoadingPrices
                ? 'Memuat...'
                : prices?.isLive
                ? 'Live'
                : (prices?.isHistoricalFallback || prices?.isOffline)
                ? 'Kemarin'
                : 'Standar'}
            </span>
          </button>

          {/* Quick Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full border border-[#26292D] bg-[#16181A] text-[#8B9097] hover:text-[#F4F5F6] active:scale-95 transition-all"
            title={effectiveTheme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle tema tampilan"
          >
            {effectiveTheme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-[#D4A346]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#D4A346]" />
            )}
          </button>

          {hasPin && (
            <button
              onClick={onLockApp}
              className="p-1.5 rounded-full border border-[#26292D] bg-[#16181A] text-[#8B9097] hover:text-[#F4F5F6] active:scale-95 transition-all"
              title="Kunci Aplikasi"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Monolithic Valuation Statement (Flat & Dominant) */}
      <section className="pt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#8B9097]">
            Total Estimasi Likuidasi
          </span>
          <button
            onClick={onToggleHideNominal}
            className="p-1 -mr-1 text-[#8B9097] hover:text-[#F4F5F6] active:scale-95 transition-all flex items-center gap-1 text-[11px]"
            title={hideNominal ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
            aria-label="Toggle privasi nominal"
          >
            {hideNominal ? (
              <EyeOff className="w-3.5 h-3.5 text-[#D4A346]" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] uppercase font-mono tracking-wider">
              {hideNominal ? 'Sensored' : 'Privasi'}
            </span>
          </button>
        </div>

        {/* Big Tabular Valuation */}
        <div className="text-[34px] leading-tight font-semibold text-[#F4F5F6] tracking-tight tabular-nums mb-2">
          {formatVal(portfolio.totalCurrentBuybackValue)}
        </div>

        {/* PnL Indicator */}
        <div className="flex items-center gap-2 mb-5">
          <span
            className={`inline-flex items-center text-xs font-semibold tabular-nums gap-0.5 ${
              isProfit ? 'text-[#34D399]' : 'text-[#F87171]'
            }`}
          >
            {isProfit ? (
              <ArrowUpRight className="w-4 h-4 stroke-[2]" />
            ) : (
              <ArrowDownRight className="w-4 h-4 stroke-[2]" />
            )}
            {hideNominal ? (
              '•••••••• (•••%)'
            ) : (
              <>
                {isProfit ? '+' : ''}
                {formatRp(portfolio.totalPnlRp)} ({isProfit ? '+' : ''}
                {portfolio.totalPnlPercent.toFixed(2)}%)
              </>
            )}
          </span>
          <span className="text-xs text-[#565A61]">selisih modal</span>
        </div>

        {/* Hairline Divider & Secondary Stats */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-[#26292D]">
          <div>
            <span className="text-xs text-[#8B9097] block mb-0.5">Total Fisik</span>
            <span className="text-sm font-semibold text-[#F4F5F6] tabular-nums">
              {portfolio.totalGrams}{' '}
              <span className="text-xs font-normal text-[#8B9097]">gram</span>
            </span>
          </div>
          <div>
            <span className="text-xs text-[#8B9097] block mb-0.5">Modal Pembelian</span>
            <span className="text-sm font-semibold text-[#F4F5F6] tabular-nums">
              {formatVal(portfolio.totalInvested)}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Primary CTA Button (Single Dominant) */}
      <button
        onClick={onOpenAdd}
        className="w-full h-12 rounded-xl bg-[#D4A346] hover:bg-[#C29235] text-[#0C0D0E] font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        Catat Emas Baru
      </button>

      {/* 4. Showcase: Koleksi Fisik (Restrained Aesthetic) */}
      <section className="space-y-3 pt-1">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8B9097]">
            Koleksi Terdaftar ({portfolio.totalCount})
          </h2>
          <button
            onClick={() => onSelectTab('collection')}
            className="text-xs font-medium text-[#D4A346] hover:underline flex items-center gap-0.5"
          >
            Lihat Semua
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {portfolio.items.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-dashed border-[#26292D] text-xs text-[#8B9097]">
            Belum ada kepingan emas yang dicatat.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
            {portfolio.items.map((item) => {
              const brandDisplay = item.brand.toLowerCase() === 'other'
                ? (item.customBrand?.trim() || 'LAINNYA').toUpperCase()
                : item.brand.toUpperCase();
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onSelectTab('collection')}
                  className="flex-shrink-0 cursor-pointer flex flex-col items-center group active:scale-95 transition-transform text-left"
                >
                  <CertiCard
                    brand={item.brand}
                    customBrand={item.customBrand}
                    weight={item.weight}
                    serialNumber={item.serialNumber}
                    size="sm"
                  />
                  <div className="mt-2 text-center w-full">
                    <span className="text-xs font-medium text-[#F4F5F6] block truncate">
                      {brandDisplay} {item.weight}g
                    </span>
                    <span className="text-[11px] tabular-nums text-[#8B9097]">
                      {formatVal(item.currentBuybackPrice)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Anchor Buyback Reference (Clean Flat Grid) */}
      <section className="pt-2">
        <div className="flex justify-between items-center mb-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8B9097]">
            Acuan Buyback 1 Gram Hari Ini
          </h2>
          <button
            onClick={() => onSelectTab('prices')}
            className="text-xs font-medium text-[#D4A346] hover:underline"
          >
            Tabel Lengkap
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl border border-[#26292D] bg-[#16181A] flex justify-between items-center">
            <span className="text-xs text-[#8B9097]">Antam LM</span>
            <span className="text-xs font-semibold text-[#F4F5F6] tabular-nums">
              {formatRp(prices?.brands?.antam?.buybackPerGram || 2293000)}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-[#26292D] bg-[#16181A] flex justify-between items-center">
            <span className="text-xs text-[#8B9097]">UBS Gold</span>
            <span className="text-xs font-semibold text-[#F4F5F6] tabular-nums">
              {formatRp(prices?.brands?.ubs?.buybackPerGram || 2293000)}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-[#26292D] bg-[#16181A] flex justify-between items-center">
            <span className="text-xs text-[#8B9097]">Galeri 24</span>
            <span className="text-xs font-semibold text-[#F4F5F6] tabular-nums">
              {formatRp(prices?.brands?.galeri24?.buybackPerGram || 2318000)}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-[#26292D] bg-[#16181A] flex justify-between items-center">
            <span className="text-xs text-[#8B9097]">HRTA (EMASKU)</span>
            <span className="text-xs font-semibold text-[#F4F5F6] tabular-nums">
              {formatRp(prices?.brands?.hrta?.buybackPerGram || 2215000)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
