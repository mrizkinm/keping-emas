import React, { useState, useRef } from 'react';
import {
  Shield,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  Smartphone,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SettingsView({
  items,
  hasPin,
  onSetPin,
  onImportItems,
  onClearAll,
  theme = 'system',
  effectiveTheme = 'dark',
  onSetTheme,
  hideNominal = false,
  onToggleHideNominal
}) {
  const [newPinInput, setNewPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinError, setPinError] = useState(null);
  const [showRemovePinConfirm, setShowRemovePinConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [importError, setImportError] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const handleExportBackup = () => {
    const backupData = {
      app: 'Keping Emas',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      itemCount: items.length,
      items: items.map(({ id, brand, customBrand, benchmarkBrand, weight, buyPrice, buyDate, serialNumber, notes }) => ({
        id,
        brand,
        customBrand: customBrand || '',
        benchmarkBrand: benchmarkBrand || 'antam',
        weight,
        buyPrice,
        buyDate,
        serialNumber,
        notes
      }))
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keping-emas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Format file tidak valid');
        }
        const importedList = Array.isArray(parsed) ? parsed : parsed.items;
        if (!Array.isArray(importedList)) {
          throw new Error('Format file tidak valid');
        }

        const success = onImportItems(importedList);
        if (success) {
          setImportError(null);
          setImportStatus(`Berhasil memulihkan keping emas.`);
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          throw new Error('Tidak ada data keping emas yang valid dalam berkas.');
        }
      } catch (err) {
        setImportError('File backup tidak valid: ' + err.message);
        setTimeout(() => setImportError(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setPinError('PIN harus berupa 4 digit angka.');
      return;
    }
    setPinError(null);
    onSetPin(newPinInput);
    setNewPinInput('');
    setShowPinInput(false);
  };

  const handleConfirmRemovePin = () => {
    onSetPin(null);
    setShowRemovePinConfirm(false);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Header */}
      <header className="pt-2">
        <h1 className="text-base font-semibold text-[#F4F5F6] tracking-tight">
          Setelan & Data
        </h1>
        <p className="text-xs text-[#8B9097]">
          Manajemen privasi, backup, dan penyimpanan lokal
        </p>
      </header>

      {/* 1. Theme Selection */}
      <section className="p-4 rounded-xl border border-[#26292D] bg-[#16181A] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-[#26292D] bg-[#0C0D0E] flex items-center justify-center text-[#D4A346]">
              {effectiveTheme === 'dark' ? (
                <Moon className="w-4 h-4 stroke-[1.5]" />
              ) : (
                <Sun className="w-4 h-4 stroke-[1.5]" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#F4F5F6]">Tema Tampilan</h2>
              <p className="text-xs text-[#8B9097]">
                {theme === 'system' ? 'Mengikuti preferensi sistem' : theme === 'dark' ? 'Mode Gelap (Quiet Luxury)' : 'Mode Terang (Alabaster Stone)'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#0C0D0E] border border-[#26292D]">
          <button
            type="button"
            onClick={() => onSetTheme?.('dark')}
            className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              theme === 'dark'
                ? 'bg-[#16181A] text-[#D4A346] shadow border border-[#26292D] font-semibold'
                : 'text-[#8B9097] hover:text-[#F4F5F6]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Gelap</span>
          </button>

          <button
            type="button"
            onClick={() => onSetTheme?.('light')}
            className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              theme === 'light'
                ? 'bg-[#16181A] text-[#D4A346] shadow border border-[#26292D] font-semibold'
                : 'text-[#8B9097] hover:text-[#F4F5F6]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Terang</span>
          </button>

          <button
            type="button"
            onClick={() => onSetTheme?.('system')}
            className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              theme === 'system'
                ? 'bg-[#16181A] text-[#D4A346] shadow border border-[#26292D] font-semibold'
                : 'text-[#8B9097] hover:text-[#F4F5F6]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Sistem</span>
          </button>
        </div>
      </section>

      {/* 2. Privacy & Stealth Mode */}
      <section className="p-4 rounded-xl border border-[#26292D] bg-[#16181A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-[#26292D] bg-[#0C0D0E] flex items-center justify-center text-[#D4A346]">
              {hideNominal ? <EyeOff className="w-4 h-4 stroke-[1.5]" /> : <Eye className="w-4 h-4 stroke-[1.5]" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#F4F5F6]">Sembunyikan Nominal</h2>
              <p className="text-xs text-[#8B9097]">
                {hideNominal ? 'Nominal disamarkan (••••••••)' : 'Nominal ditampilkan penuh'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleHideNominal}
            className={`min-w-[48px] h-7 rounded-full transition-colors relative p-0.5 flex items-center ${
              hideNominal ? 'bg-[#D4A346]' : 'bg-[#26292D]'
            }`}
            title={hideNominal ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
            aria-label="Toggle sembunyikan nominal"
          >
            <span
              className={`block w-6 h-6 rounded-full bg-[#0C0D0E] transition-transform ${
                hideNominal ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 3. Security Lock */}
      <section className="p-4 rounded-xl border border-[#26292D] bg-[#16181A] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-[#26292D] bg-[#0C0D0E] flex items-center justify-center text-[#D4A346]">
              <Shield className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#F4F5F6]">Proteksi PIN</h2>
              <p className="text-xs text-[#8B9097]">
                {hasPin ? 'PIN 4 digit aktif' : 'Belum terkunci'}
              </p>
            </div>
          </div>

          {hasPin ? (
            <button
              onClick={() => setShowRemovePinConfirm(true)}
              className="text-xs text-[#F87171] hover:underline"
            >
              Hapus PIN
            </button>
          ) : (
            <button
              onClick={() => {
                setShowPinInput(!showPinInput);
                setPinError(null);
              }}
              className="h-8 px-3 rounded-lg border border-[#26292D] bg-[#0C0D0E] text-xs font-semibold text-[#F4F5F6] hover:border-[#D4A346] active:scale-95 transition-all"
            >
              Atur PIN
            </button>
          )}
        </div>

        {showRemovePinConfirm && (
          <div className="p-3 rounded-lg border border-[#F87171]/30 bg-[#0C0D0E] text-xs space-y-2">
            <p className="text-[#F87171]">Nonaktifkan proteksi PIN aplikasi?</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowRemovePinConfirm(false)}
                className="px-2.5 py-1 rounded bg-[#26292D] text-[#8B9097]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRemovePin}
                className="px-2.5 py-1 rounded bg-[#F87171] text-[#0C0D0E] font-semibold"
              >
                Nonaktifkan
              </button>
            </div>
          </div>
        )}

        {showPinInput && (
          <div className="space-y-2 pt-2 border-t border-[#26292D]">
            {pinError && (
              <p className="text-xs text-[#F87171]">{pinError}</p>
            )}
            <form onSubmit={handleSavePin} className="flex gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="4 digit..."
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                className="flex-1 h-9 bg-[#0C0D0E] border border-[#26292D] rounded-lg px-3 text-center tracking-widest text-sm font-mono text-[#F4F5F6] focus:outline-none focus:border-[#D4A346]"
                autoFocus
              />
              <button
                type="submit"
                className="h-9 px-3 rounded-lg bg-[#D4A346] text-[#0C0D0E] font-semibold text-xs"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPinInput(false);
                  setPinError(null);
                }}
                className="h-9 px-3 rounded-lg bg-[#26292D] text-[#8B9097] text-xs"
              >
                Batal
              </button>
            </form>
          </div>
        )}
      </section>

      {/* 4. Backup & Restore Data */}
      <section className="p-4 rounded-xl border border-[#26292D] bg-[#16181A] space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-[#F4F5F6] mb-0.5">Cadangkan & Pulihkan</h2>
          <p className="text-xs text-[#8B9097]">
            Data tersimpan 100% di browser HP ini. Simpan file cadangan JSON saat ingin berpindah perangkat.
          </p>
        </div>

        {importStatus && (
          <div className="p-2.5 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20 text-xs text-[#34D399] flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {importError && (
          <div className="p-2.5 rounded-lg bg-[#F87171]/10 border border-[#F87171]/20 text-xs text-[#F87171]">
            {importError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="h-10 rounded-lg border border-[#26292D] bg-[#0C0D0E] hover:border-[#D4A346] text-xs font-semibold text-[#F4F5F6] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#D4A346]" />
            Ekspor JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-10 rounded-lg border border-[#26292D] bg-[#0C0D0E] hover:border-[#D4A346] text-xs font-semibold text-[#F4F5F6] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-[#8B9097]" />
            Pulihkan JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </section>

      {/* 5. Reset All Data */}
      <section className="p-4 rounded-xl border border-[#26292D] bg-[#16181A]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#F4F5F6]">Kosongkan Portofolio</h2>
            <p className="text-xs text-[#8B9097]">Hapus semua catatan kepingan</p>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-xs text-[#F87171] hover:underline"
          >
            Hapus Semua
          </button>
        </div>

        {showClearConfirm && (
          <div className="mt-3 p-3 rounded-lg border border-[#F87171]/30 bg-[#0C0D0E] text-xs space-y-2">
            <p className="text-[#F87171]">
              Hapus seluruh ({items.length}) keping emas secara permanen?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 rounded bg-[#26292D] text-[#8B9097]"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="px-2.5 py-1 rounded bg-[#F87171] text-[#0C0D0E] font-semibold"
              >
                Konfirmasi Hapus
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 6. About System */}
      <footer className="text-xs text-[#565A61] pt-2 space-y-1">
        <p className="text-[#8B9097] font-medium">Keping Emas v1.0.0 (Local-First Architecture)</p>
        <p>• Data diolah lokal via Web Storage API tanpa pelacakan server.</p>
        <p>• Tanpa batas kuota gramasi.</p>
      </footer>
    </div>
  );
}
