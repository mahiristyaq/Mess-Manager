import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { MessProvider, useMess } from './context/MessContext';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { HomeTab } from './components/tabs/HomeTab';
import { MealsTab } from './components/tabs/MealsTab';
import { MarketTab } from './components/tabs/MarketTab';
import { HistoryTab } from './components/tabs/HistoryTab';
import { ReportTab } from './components/tabs/ReportTab';
import { AuthModal } from './components/modals/AuthModal';
import { EntryModal } from './components/modals/EntryModal';
import { AdminGateModal } from './components/modals/AdminGateModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ReportEditModal } from './components/modals/ReportEditModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { QuickSettingsDrawer } from './components/QuickSettingsDrawer';
import { Toast } from './components/Toast';

const MainApp: React.FC = () => {
  const {
    activeTab,
    isAuthModalOpen,
    isSettingsOpen,
    isQuickSettingsOpen,
    isAdminGateOpen,
    isEntryModalOpen,
    isReportEditOpen,
    confirmModal,
  } = useMess();

  const isAnyModalOpen = Boolean(
    isAuthModalOpen ||
    isSettingsOpen ||
    isQuickSettingsOpen ||
    isAdminGateOpen ||
    isEntryModalOpen ||
    isReportEditOpen ||
    confirmModal?.isOpen
  );

  React.useEffect(() => {
    if (isAnyModalOpen) {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      return () => {
        const top = document.body.style.top;
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        if (top) {
          window.scrollTo(0, parseInt(top || '0', 10) * -1);
        }
      };
    } else {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    }
  }, [isAnyModalOpen]);

  return (
    <>
      <div className="app-container">
        {!isAuthModalOpen && (
          <>
            <Header />
            <main className="w-full max-w-full min-w-0 overflow-x-hidden p-3 pb-1.5 sm:p-5 sm:pb-2 lg:p-6 lg:pb-3 space-y-4">
              {activeTab === 'home' && <HomeTab />}
              {activeTab === 'meals' && <MealsTab />}
              {(activeTab === 'market' || activeTab === 'history') && <MarketTab />}
              {activeTab === 'report' && <ReportTab />}
            </main>
            <Navbar />
          </>
        )}
      </div>

      {/* Modals, drawers and notifications */}
      <QuickSettingsDrawer />
      <AuthModal />
      <EntryModal />
      <AdminGateModal />
      <SettingsModal />
      <ReportEditModal />
      <ConfirmModal />
      <Toast />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MessProvider>
          <MainApp />
        </MessProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
