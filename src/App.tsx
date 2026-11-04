import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ToastProvider } from '@/components/ui/Toast';
import { AppProvider, useApp } from '@/context/AppContext';
import { AppLayout } from '@/layouts/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingScreen } from '@/components/LoadingScreen';
import { WelcomeModal } from '@/components/WelcomeModal';
import { RecoveryModal } from '@/components/ResetModal';
import HomePage from '@/pages/HomePage';

const ProgressPage = lazy(() => import('@/pages/ProgressPage'));
const AchievementsPage = lazy(() => import('@/pages/AchievementsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const TreePage = lazy(() => import('@/pages/TreePage'));
const JournalPage = lazy(() => import('@/pages/JournalPage'));
const EmergencyPage = lazy(() => import('@/pages/EmergencyPage'));
const FocusPage = lazy(() => import('@/pages/FocusPage'));
const CoachPage = lazy(() => import('@/pages/CoachPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));

function PageFallback() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}

function StorageFailure({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center text-ink">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-danger/15 text-danger">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold">Local storage is unavailable</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{message}</p>
      <p className="mt-2 max-w-sm text-xs text-muted">Iron Will stores everything on your device, so it needs IndexedDB. Try a normal (non-private) browser window.</p>
      <button onClick={() => window.location.reload()} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-accent px-6 font-semibold text-onaccent">
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}

function Shell() {
  const { ready, fatalError } = useApp();
  if (!ready) return <LoadingScreen />;
  if (fatalError) return <StorageFailure message={fatalError} />;
  return (
    <HashRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="tree" element={<TreePage />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="emergency" element={<EmergencyPage />} />
            <Route path="focus" element={<FocusPage />} />
            <Route path="coach" element={<CoachPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
      <WelcomeModal />
      <RecoveryModal />
    </HashRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <Shell />
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
