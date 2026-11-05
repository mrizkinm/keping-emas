import React, { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import CertiCard from '../components/CertiCard';

const FILTER_BRANDS = [
  { id: 'all', label: 'Semua' },
  { id: 'antam', label: 'Antam' },
  { id: 'ubs', label: 'UBS' },
  { id: 'galeri24', label: 'Galeri 24' },
  { id: 'hrta', label: 'HRTA' },
  { id: 'other', label: 'Lainnya' }
];

export default function CollectionView({
  items,
  onOpenAdd,
  onEditItem,
  onDeleteItem,
  hideNominal = false,
  onToggleHideNominal
}) {
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const formatRp = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
  const formatVal = (num) => hideNominal ? 'Rp ••••••••' : formatRp(num);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (selectedBrand !== 'all') {
      result = result.filter((item) => {
        const b = (item.brand || '').toLowerCase();
        if (selectedBrand === 'other') {
          return b === 'other' || !['antam', 'ubs', 'galeri24', 'hrta'].includes(b);
        }
        return b === selectedBrand;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.buyDate) - new Date(a.buyDate);
      if (sortBy === 'weight-desc') return b.weight - a.weight;
      if (sortBy === 'value-desc') return b.currentBuybackPrice - a.currentBuybackPrice;
      if (sortBy === 'profit-desc') return b.pnlRp - a.pnlRp;
      return 0;
    });

    return result;
  }, [items, selectedBrand, sortBy]);

  const totalFilteredGrams = filteredItems.reduce((acc, it) => acc + (parseFloat(it.weight) || 0), 0);

  return (
    <div className="space-y-4 pb-28">
      {/* Top Header */}
      <header className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-base font-semibold text-[#F4F5F6] tracking-tight">
            Koleksi Emas
          </h1>
          <p className="text-xs text-[#8B9097] tabular-nums">
            {filteredItems.length} keping • {Math.round(totalFilteredGrams * 100) / 100} gram
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleHideNominal}
            className="h-9 w-9 rounded-lg border border-[#26292D] bg-[#16181A] text-[#8B9097] hover:text-[#F4F5F6] flex items-center justify-center active:scale-95 transition-all"
            title={hideNominal ? 'Tampilkan Nominal' : 'Sembunyikan Nominal'}
            aria-label="Toggle privasi nominal"
          >
            {hideNominal ? (
              <EyeOff className="w-3.5 h-3.5 text-[#D4A346]" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={onOpenAdd}
            className="h-9 px-3 rounded-lg bg-[#D4A346] hover:bg-[#C29235] text-[#0C0D0E] font-semibold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Tambah
          </button>
        </div>
      </header>

      {/* Filter Segmented Control Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_BRANDS.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBrand(b.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
              selectedBrand === b.id
                ? 'bg-[#16181A] border-[#F4F5F6]/20 text-[#F4F5F6] font-semibold'
                : 'bg-transparent border-[#26292D] text-[#8B9097] hover:text-[#F4F5F6]'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Sort Option (Discreet) */}
      <div className="flex justify-between items-center text-xs text-[#8B9097] px-1">
        <span>Urutkan</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#16181A] border border-[#26292D] text-xs text-[#F4F5F6] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#D4A346]"
        >
          <option value="newest">Tanggal Pembelian Terbaru</option>
          <option value="weight-desc">Gramasi Terbesar</option>
          <option value="value-desc">Nilai Likuidasi Tertinggi</option>
          <option value="profit-desc">Keuntungan Tertinggi</option>
        </select>
      </div>

      {/* Flat Structured List (Hairline Dividers, No nested boxes) */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-[#26292D] text-xs text-[#8B9097]">
          Tidak ada kepingan emas pada kategori ini.
        </div>
      ) : (
        <div className="divide-y divide-[#26292D] border-t border-b border-[#26292D]">
          {filteredItems.map((item) => {
            const isProfit = item.pnlRp >= 0;
            const brandDisplay = item.brand.toLowerCase() === 'other'
              ? (item.customBrand?.trim() || 'LAINNYA').toUpperCase()
              : item.brand.toUpperCase();
            return (
              <div key={item.id} className="py-3.5 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <CertiCard
                      brand={item.brand}
                      customBrand={item.customBrand}
                      weight={item.weight}
                      serialNumber={item.serialNumber}
                      size="sm"
                      className="!w-14 !h-20"
                    />
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="text-sm font-semibold text-[#F4F5F6] tracking-tight truncate">
                        {brandDisplay} {item.weight}g
                      </span>
                      <span className="text-sm font-semibold text-[#F4F5F6] tabular-nums">
                        {formatVal(item.currentBuybackPrice)}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs text-[#8B9097] mb-1">
                      <span className="truncate">
                        {item.buyDate} • {item.serialNumber || 'CertiCard'}
                      </span>
                      <span
                        className={`tabular-nums font-medium flex items-center gap-0.5 ${
                          isProfit ? 'text-[#34D399]' : 'text-[#F87171]'
                        }`}
                      >
                        {isProfit ? (
                          <ArrowUpRight className="w-3 h-3 stroke-[2]" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 stroke-[2]" />
                        )}
                        {hideNominal ? (
                          '••••••••'
                        ) : (
                          <>
                            {isProfit ? '+' : ''}
                            {formatRp(item.pnlRp)} ({isProfit ? '+' : ''}
                            {item.pnlPercent.toFixed(1)}%)
                          </>
                        )}
                      </span>
                    </div>

                    {/* Bottom Micro Details & Actions */}
                    <div className="flex items-center justify-between text-[11px] text-[#565A61] pt-1">
                      <span className="tabular-nums">
                        Modal: {formatVal(item.buyPrice)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditItem(item)}
                          className="text-[#8B9097] hover:text-[#F4F5F6] p-1"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="text-[#8B9097] hover:text-[#F87171] p-1"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline discreet delete confirm */}
                {deleteConfirmId === item.id && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#16181A] border border-[#26292D] text-xs">
                    <span className="text-[#F87171] font-medium">Hapus keping ini?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2.5 py-1 rounded bg-[#26292D] text-[#8B9097] hover:text-[#F4F5F6]"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => {
                          onDeleteItem(item.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2.5 py-1 rounded bg-[#F87171] text-[#0C0D0E] font-semibold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
