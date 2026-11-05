import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Bot, ChevronRight, Mail, Play, Siren, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { TimerRing } from '@/components/TimerRing';
import { LiveTimer } from '@/components/LiveTimer';
import { MilestoneSummary } from '@/components/MilestoneSummary';
import { StatTiles } from '@/components/StatTiles';
import { QuoteCard } from '@/components/QuoteCard';
import { TreePreviewCard } from '@/components/TreePreviewCard';
import { MoneySavedCard } from '@/components/MoneySavedCard';
import { RecentAchievements } from '@/components/RecentAchievements';
import { InstallBanner } from '@/components/InstallBanner';
import { StartTimerModal } from '@/components/StartTimerModal';
import { ProfileModal } from '@/components/ProfileModal';
import { useApp } from '@/context/AppContext';
import { greetingFor } from '@/utils/time';
import { APP_TAGLINE } from '@/data/constants';

export default function HomePage() {
  const { startedAt, milestones, profile } = useApp();
  const [startOpen, setStartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{greetingFor()}</p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
            {profile.habitName ? `Quitting ${profile.habitName.toLowerCase()}` : 'Your journey'}
          </h1>
        </div>
        <Logo size={44} className="lg:hidden" />
      </header>

      <InstallBanner />

      {startedAt == null ? (
        <Card glow className="px-6 py-10 text-center">
          <Logo size={72} className="mx-auto mb-5" />
          <h2 className="text-2xl font-extrabold tracking-tight">Ready to begin?</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">{APP_TAGLINE} Start your timer now, or set the date you actually began.</p>
          <Button variant="primary" size="lg" className="mt-6" icon={<Play className="h-5 w-5" />} onClick={() => setStartOpen(true)}>
            Start my journey
          </Button>
        </Card>
      ) : (
        <Card glow className="px-4 py-6 sm:px-8">
          <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr] lg:gap-10">
            <div className="flex justify-center">
              <TimerRing startedAt={startedAt} milestones={milestones} />
            </div>
            <div className="space-y-4">
              <LiveTimer startedAt={startedAt} />
              <MilestoneSummary startedAt={startedAt} milestones={milestones} />
              <Link to="/progress" className="flex items-center justify-center gap-1 text-sm font-semibold text-accent">
                Manage timer &amp; milestones <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/emergency"
          className="group relative flex min-h-[104px] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 to-orange-500 p-4 text-white shadow-lg shadow-rose-600/20 transition active:scale-[0.98]"
        >
          <Siren className="h-7 w-7" />
          <div>
            <div className="text-base font-bold leading-tight">Emergency</div>
            <div className="text-xs text-white/80">Craving right now? Tap here.</div>
          </div>
        </Link>
        <Link
          to="/focus"
          className="flex min-h-[104px] flex-col justify-between rounded-3xl border border-line bg-surface p-4 transition active:scale-[0.98] hover:border-accent/40"
        >
          <Target className="h-7 w-7 text-accent" />
          <div>
            <div className="text-base font-bold leading-tight">Focus Mode</div>
            <div className="text-xs text-muted">Distraction-free timer</div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link to="/coach" className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-3xl border border-line bg-surface p-3 text-center transition active:scale-[0.98] hover:border-accent/40">
          <Bot className="h-6 w-6 text-accent" />
          <div className="text-sm font-bold leading-tight">Coach</div>
          <div className="text-[11px] leading-tight text-muted">Guidance</div>
        </Link>
        <Link to="/history" className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-3xl border border-line bg-surface p-3 text-center transition active:scale-[0.98] hover:border-accent/40">
          <BarChart3 className="h-6 w-6 text-accent" />
          <div className="text-sm font-bold leading-tight">History</div>
          <div className="text-[11px] leading-tight text-muted">Insights</div>
        </Link>
        <Link to="/letters" className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-3xl border border-line bg-surface p-3 text-center transition active:scale-[0.98] hover:border-accent/40">
          <Mail className="h-6 w-6 text-accent" />
          <div className="text-sm font-bold leading-tight">Letters</div>
          <div className="text-[11px] leading-tight text-muted">To future me</div>
        </Link>
      </div>

      <StatTiles />

      <QuoteCard />

      <div className="grid gap-5 md:grid-cols-2">
        <TreePreviewCard />
        <MoneySavedCard onEdit={() => setProfileOpen(true)} />
      </div>

      <RecentAchievements />

      <StartTimerModal open={startOpen} onClose={() => setStartOpen(false)} mode="start" />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
