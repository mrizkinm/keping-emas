import React, { useState, useEffect, useCallback } from 'react';
import {
  Coins,
  Layers,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useGoldData } from './hooks/useGoldData';
import { haptic } from './utils/haptics';
import DashboardView from './views/DashboardView';
import CollectionView from './views/CollectionView';
import PricesView from './views/PricesView';
import SettingsView from './views/SettingsView';
import AddGoldSheet from './components/AddGoldSheet';
import ZakatSheet from './components/ZakatSheet';
import PinLockModal from './components/PinLockModal';

export default function App() {
  const {
    items,
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
    hasPin,
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
  } = useGoldData();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isZakatOpen, setIsZakatOpen] = useState(false);
  const [editItemTarget, setEditItemTarget] = useState(null);

  // 1. Mobile Hardware & Gesture Back Action (popstate listener)
  useEffect(() => {
    const handlePopState = (event) => {
      // Priority 1: If zakat modal is open, close it first
      if (isZakatOpen) {
        setIsZakatOpen(false);
        haptic('light');
        return;
      }

      // Priority 2: If sheet modal is open, close it first without disrupting current tab
      if (isSheetOpen) {
        setIsSheetOpen(false);
        setEditItemTarget(null);
        haptic('light');
        return;
      }

      // Priority 3: If event has target tab state, navigate to it
      if (event.state?.tab) {
        setActiveTab(event.state.tab);
        haptic('light');
        return;
      }

      // Priority 4: If in sub-tabs without state, return to Dashboard tab
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        haptic('light');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSheetOpen, isZakatOpen, activeTab]);

  const handleOpenAdd = () => {
    haptic('light');
    setEditItemTarget(null);
    setIsSheetOpen(true);
    window.history.pushState({ modal: 'sheet', tab: activeTab }, '');
  };

  const handleOpenEdit = (item) => {
    haptic('light');
    setEditItemTarget(item);
    setIsSheetOpen(true);
    window.history.pushState({ modal: 'sheet', tab: activeTab }, '');
  };

  const handleCloseSheet = useCallback(() => {
    if (window.history.state?.modal === 'sheet') {
      window.history.back();
    } else {
      setIsSheetOpen(false);
      setEditItemTarget(null);
    }
  }, []);

  const handleOpenZakat = () => {
    haptic('light');
    setIsZakatOpen(true);
    window.history.pushState({ modal: 'zakat', tab: activeTab }, '');
  };

  const handleCloseZakat = useCallback(() => {
    if (window.history.state?.modal === 'zakat') {
      window.history.back();
    } else {
      setIsZakatOpen(false);
    }
  }, []);

  const handleSelectTab = (tab) => {
    if (tab === activeTab) return;
    haptic('light');
    if (activeTab === 'dashboard') {
      window.history.pushState({ tab }, '');
    }
    setActiveTab(tab);
  };

  const handleSaveSheet = (formData) => {
    haptic('success');
    if (editItemTarget) {
      updateItem(editItemTarget.id, formData);
    } else {
      addItem(formData);
    }
    handleCloseSheet();
  };

  if (isLocked) {
    return <PinLockModal onUnlock={verifyAndUnlock} />;
  }

  return (
    <div className="min-h-screen bg-[#0C0D0E] text-[#F4F5F6] flex justify-center selection:bg-[#D4A346] selection:text-black">
      {/* Mobile-First Constrained Frame: 390px - 440px with touch optimization */}
      <div className="w-full max-w-md min-h-screen bg-[#0C0D0E] flex flex-col relative px-5 pt-3 border-x border-[#26292D] shadow-2xl overscroll-contain">
        
        {/* Main Content View */}
        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView
              portfolio={portfolio}
              prices={prices}
              isLoadingPrices={isLoadingPrices}
              onRefreshPrices={fetchPrices}
              onOpenAdd={handleOpenAdd}
              onSelectTab={handleSelectTab}
              hasPin={hasPin}
              onLockApp={() => {
                haptic('medium');
                lockApp();
              }}
              effectiveTheme={effectiveTheme}
              onToggleTheme={() => {
                haptic('light');
                toggleTheme();
              }}
              hideNominal={hideNominal}
              onToggleHideNominal={() => {
                haptic('light');
                toggleHideNominal();
              }}
              onOpenZakat={handleOpenZakat}
            />
          )}

          {activeTab === 'collection' && (
            <CollectionView
              items={items}
              onOpenAdd={handleOpenAdd}
              onEditItem={handleOpenEdit}
              onDeleteItem={(id) => {
                haptic('warning');
                deleteItem(id);
              }}
              hideNominal={hideNominal}
              onToggleHideNominal={() => {
                haptic('light');
                toggleHideNominal();
              }}
            />
          )}

          {activeTab === 'prices' && (
            <PricesView
              prices={prices}
              isLoading={isLoadingPrices}
              onRefresh={fetchPrices}
              priceError={priceError}
              onOpenZakat={handleOpenZakat}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              items={items}
              hasPin={hasPin}
              onSetPin={(p) => {
                haptic('success');
                setAppPin(p);
              }}
              onImportItems={(arr) => {
                haptic('success');
                return importItems(arr);
              }}
              onClearAll={() => {
                haptic('warning');
                clearAllItems();
              }}
              theme={theme}
              effectiveTheme={effectiveTheme}
              onSetTheme={(t) => {
                haptic('light');
                setTheme(t);
              }}
              hideNominal={hideNominal}
              onToggleHideNominal={() => {
                haptic('light');
                toggleHideNominal();
              }}
            />
          )}
        </main>

        {/* Minimalist Bottom Navigation Bar (48px+ touch targets) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="w-full max-w-md bg-[#0C0D0E]/95 backdrop-blur-md border-t border-x border-[#26292D] px-2 pt-1.5 pb-safe flex items-center justify-around pointer-events-auto">
            <button
              onClick={() => handleSelectTab('dashboard')}
              className={`flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                activeTab === 'dashboard' ? 'text-[#D4A346]' : 'text-[#8B9097] hover:text-[#F4F5F6]'
              }`}
            >
              <Coins className="w-4 h-4 stroke-[1.5]" />
              <span className={`text-[10px] ${activeTab === 'dashboard' ? 'font-semibold' : 'font-normal'}`}>
                Portofolio
              </span>
            </button>

            <button
              onClick={() => handleSelectTab('collection')}
              className={`flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                activeTab === 'collection' ? 'text-[#D4A346]' : 'text-[#8B9097] hover:text-[#F4F5F6]'
              }`}
            >
              <Layers className="w-4 h-4 stroke-[1.5]" />
              <span className={`text-[10px] ${activeTab === 'collection' ? 'font-semibold' : 'font-normal'}`}>
                Koleksi
              </span>
            </button>

            <button
              onClick={() => handleSelectTab('prices')}
              className={`flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                activeTab === 'prices' ? 'text-[#D4A346]' : 'text-[#8B9097] hover:text-[#F4F5F6]'
              }`}
            >
              <TrendingUp className="w-4 h-4 stroke-[1.5]" />
              <span className={`text-[10px] ${activeTab === 'prices' ? 'font-semibold' : 'font-normal'}`}>
                Harga
              </span>
            </button>

            <button
              onClick={() => handleSelectTab('settings')}
              className={`flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                activeTab === 'settings' ? 'text-[#D4A346]' : 'text-[#8B9097] hover:text-[#F4F5F6]'
              }`}
            >
              <Settings className="w-4 h-4 stroke-[1.5]" />
              <span className={`text-[10px] ${activeTab === 'settings' ? 'font-semibold' : 'font-normal'}`}>
                Setelan
              </span>
            </button>
          </div>
        </nav>

        {/* Bottom Drawer Form */}
        <AddGoldSheet
          isOpen={isSheetOpen}
          onClose={handleCloseSheet}
          onSave={handleSaveSheet}
          editItem={editItemTarget}
          prices={prices}
        />

        {/* Zakat Calculator Bottom Sheet */}
        <ZakatSheet
          isOpen={isZakatOpen}
          onClose={handleCloseZakat}
          portfolio={portfolio}
          prices={prices}
          hideNominal={hideNominal}
        />
      </div>
    </div>
  );
}
