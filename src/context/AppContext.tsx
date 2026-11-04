import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { initDatabase, StorageError, toStorageError } from '@/database/db';
import { DEFAULT_PROFILE, getProfile, saveProfile as persistProfile } from '@/services/profileService';
import { editStartTime, getTimer, listAttempts, resetTimer, startTimer } from '@/services/timerService';
import {
  addCustomMilestone,
  buildMilestones,
  listAchievements,
  listCustomMilestones,
  removeCustomMilestone,
  unlockReached,
} from '@/services/achievementService';
import { listFavoriteIds, toggleFavoriteQuote } from '@/services/quoteService';
import { applyTheme, clearPrefs, DEFAULT_PREFS, loadPrefs, savePrefs, sanitizePrefs } from '@/storage/localPrefs';
import { useToast } from '@/components/ui/Toast';
import type {
  AccentId,
  AchievementRecord,
  Attempt,
  CustomMilestone,
  LocalPrefs,
  Milestone,
  Profile,
  ThemeMode,
} from '@/types';

interface AppState {
  ready: boolean;
  fatalError: string | null;
  persisted: boolean | null;
  startedAt: number | null;
  attempts: Attempt[];
  achievements: AchievementRecord[];
  customMilestones: CustomMilestone[];
  milestones: Milestone[];
  profile: Profile;
  favoriteIds: string[];
  prefs: LocalPrefs;
  welcomeOpen: boolean;
  /** Set right after a reset so the recovery message can be displayed. */
  recoveryOpen: boolean;
}

interface AppActions {
  startTimerAt: (ts: number) => Promise<void>;
  editStart: (ts: number) => Promise<void>;
  resetWithRecovery: (note?: string) => Promise<void>;
  closeRecovery: () => void;
  saveProfile: (p: Profile) => Promise<void>;
  setTheme: (t: ThemeMode) => void;
  setAccent: (a: AccentId) => void;
  openWelcome: () => void;
  closeWelcome: () => void;
  markWelcomeSeen: () => void;
  toggleFavorite: (quoteId: string) => Promise<void>;
  addMilestone: (days: number, title: string) => Promise<void>;
  removeMilestone: (id: string) => Promise<void>;
  resetPreferences: () => void;
  /** Re-read everything from IndexedDB (after import / restore / clear). */
  reload: (importedPrefs?: Partial<LocalPrefs>) => Promise<void>;
}

type Ctx = AppState & AppActions;
const AppContext = createContext<Ctx | null>(null);

const INITIAL_PREFS = loadPrefs();

export function AppProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [state, setState] = useState<AppState>({
    ready: false,
    fatalError: null,
    persisted: null,
    startedAt: null,
    attempts: [],
    achievements: [],
    customMilestones: [],
    milestones: buildMilestones([]),
    profile: DEFAULT_PROFILE,
    favoriteIds: [],
    prefs: INITIAL_PREFS,
    welcomeOpen: !INITIAL_PREFS.welcomeSeen,
    recoveryOpen: false,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const patch = useCallback((p: Partial<AppState>) => setState((s) => ({ ...s, ...p })), []);

  const loadAll = useCallback(async () => {
    const [timer, attempts, achievements, custom, profile, favoriteIds] = await Promise.all([
      getTimer(),
      listAttempts(),
      listAchievements(),
      listCustomMilestones(),
      getProfile(),
      listFavoriteIds(),
    ]);
    return {
      startedAt: timer?.startedAt ?? null,
      attempts,
      achievements,
      customMilestones: custom,
      milestones: buildMilestones(custom),
      profile,
      favoriteIds,
    };
  }, []);

  /* ---- boot ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { persisted } = await initDatabase();
        const data = await loadAll();
        if (!cancelled) patch({ ...data, persisted, ready: true });
      } catch (err) {
        const e = toStorageError(err);
        if (!cancelled) patch({ fatalError: e.message, ready: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAll, patch]);

  /* ---- theme ---- */
  useEffect(() => {
    applyTheme(state.prefs.theme, state.prefs.accent);
  }, [state.prefs.theme, state.prefs.accent]);

  /* ---- achievements: check regularly against the real clock ---- */
  const checkAchievements = useCallback(async () => {
    const s = stateRef.current;
    if (!s.ready || s.fatalError || s.startedAt == null) return;
    try {
      const fresh = await unlockReached(s.startedAt, s.milestones);
      if (fresh.length) {
        const list = await listAchievements();
        patch({ achievements: list });
        const top = [...fresh].sort((a, b) => b.days - a.days)[0];
        if (fresh.length === 1) toast.achievement(`Achievement unlocked: ${top.title}`, `${top.days} ${top.days === 1 ? 'day' : 'days'} strong. Keep going!`);
        else toast.achievement(`${fresh.length} achievements unlocked`, `Your highest: ${top.title} (${top.days} days).`);
      }
    } catch {
      /* non-fatal */
    }
  }, [patch, toast]);

  useEffect(() => {
    if (!state.ready) return;
    void checkAchievements();
    const id = window.setInterval(() => void checkAchievements(), 5000);
    return () => window.clearInterval(id);
  }, [state.ready, state.startedAt, state.milestones, checkAchievements]);

  /* ---- actions ---- */
  const actions = useMemo<AppActions>(() => {
    const guard = async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        const e = err instanceof StorageError ? err : err instanceof Error ? err : toStorageError(err);
        toast.error('Something went wrong', e.message);
        throw e;
      }
    };

    const updatePrefs = (partial: Partial<LocalPrefs>) => {
      const next = { ...stateRef.current.prefs, ...partial };
      savePrefs(next);
      patch({ prefs: next });
    };

    return {
      startTimerAt: (ts) =>
        guard(async () => {
          const t = await startTimer(ts);
          patch({ startedAt: t.startedAt });
        }),
      editStart: (ts) =>
        guard(async () => {
          const t = await editStartTime(ts);
          patch({ startedAt: t.startedAt });
        }),
      resetWithRecovery: (note) =>
        guard(async () => {
          const { timer } = await resetTimer({ note, habitName: stateRef.current.profile.habitName });
          const attempts = await listAttempts();
          patch({ startedAt: timer.startedAt, attempts, recoveryOpen: true });
        }),
      closeRecovery: () => patch({ recoveryOpen: false }),
      saveProfile: (p) =>
        guard(async () => {
          const saved = await persistProfile(p);
          patch({ profile: saved });
        }),
      setTheme: (theme) => updatePrefs({ theme }),
      setAccent: (accent) => updatePrefs({ accent }),
      openWelcome: () => patch({ welcomeOpen: true }),
      closeWelcome: () => {
        updatePrefs({ welcomeSeen: true, communityDismissedAt: Date.now() });
        patch({ welcomeOpen: false });
      },
      markWelcomeSeen: () => {
        updatePrefs({ welcomeSeen: true, communityDismissedAt: Date.now() });
        patch({ welcomeOpen: false });
      },
      toggleFavorite: (quoteId) =>
        guard(async () => {
          const isFav = stateRef.current.favoriteIds.includes(quoteId);
          await toggleFavoriteQuote(quoteId, !isFav);
          patch({ favoriteIds: await listFavoriteIds() });
        }),
      addMilestone: (days, title) =>
        guard(async () => {
          await addCustomMilestone(days, title);
          const custom = await listCustomMilestones();
          patch({ customMilestones: custom, milestones: buildMilestones(custom) });
        }),
      removeMilestone: (id) =>
        guard(async () => {
          await removeCustomMilestone(id);
          const custom = await listCustomMilestones();
          patch({ customMilestones: custom, milestones: buildMilestones(custom) });
        }),
      resetPreferences: () => {
        clearPrefs();
        const keep: LocalPrefs = { ...DEFAULT_PREFS, welcomeSeen: true, communityDismissedAt: stateRef.current.prefs.communityDismissedAt };
        savePrefs(keep);
        patch({ prefs: keep });
      },
      reload: async (importedPrefs) => {
        const data = await loadAll();
        const prefs = { ...stateRef.current.prefs, ...sanitizePrefs(importedPrefs) };
        savePrefs(prefs);
        patch({ ...data, prefs });
      },
    };
  }, [loadAll, patch, toast]);

  const value = useMemo<Ctx>(() => ({ ...state, ...actions }), [state, actions]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
