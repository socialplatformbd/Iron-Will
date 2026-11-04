import { Link } from 'react-router-dom';
import { Bell, ChevronRight, Download, Info, Moon, Palette, Sun, Users } from 'lucide-react';
import { Card, PageHeader, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CommunityButtons } from '@/components/CommunityButtons';
import { DataManagement } from '@/components/DataManagement';
import { DeveloperCard } from '@/components/DeveloperCard';
import { useApp } from '@/context/AppContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useToast } from '@/components/ui/Toast';
import { ACCENTS, APP_NAME, APP_VERSION } from '@/data/constants';
import { cn } from '@/utils/cn';

export default function SettingsPage() {
  const { prefs, setTheme, setAccent, openWelcome } = useApp();
  const { canInstall, installed, install } = useInstallPrompt();
  const toast = useToast();

  return (
    <div className="space-y-7">
      <PageHeader title="Settings" subtitle="Everything here is stored on this device only." />

      <section>
        <SectionTitle title="Appearance" />
        <Card className="space-y-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Palette className="h-4 w-4 text-accent" /> Theme
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface2 p-1" role="radiogroup" aria-label="Theme">
              {(
                [
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'light', label: 'Light', icon: Sun },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const active = prefs.theme === t.id;
                return (
                  <button
                    key={t.id}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      'flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                      active ? 'bg-surface text-ink shadow' : 'text-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold">Accent colour</div>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Accent colour">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  role="radio"
                  aria-checked={prefs.accent === a.id}
                  aria-label={a.label}
                  onClick={() => setAccent(a.id)}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full border-2 transition',
                    prefs.accent === a.id ? 'border-ink' : 'border-transparent'
                  )}
                >
                  <span className="h-9 w-9 rounded-full" style={{ background: a.color }} />
                </button>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle title="Notifications" />
        <Card className="flex items-start gap-3.5">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">Reminders &amp; milestone alerts</p>
            <p className="mt-1 text-muted">
              Scheduled reminders are not available yet, because a fully offline web app cannot reliably wake itself up in the background. Achievement unlocks appear in-app while Iron Will is open.
            </p>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle title="Developer information" />
        <DeveloperCard />
      </section>

      <section>
        <SectionTitle title="Community" />
        <Card>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-accent" /> Telegram Channel &amp; WhatsApp Group
          </div>
          <CommunityButtons />
          <Button variant="outline" full className="mt-3" onClick={openWelcome}>
            Reopen Welcome Invitation
          </Button>
        </Card>
      </section>

      {(canInstall || installed) && (
        <section>
          <SectionTitle title="Install" />
          <Card className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-semibold">{installed ? 'Installed as an app' : 'Install on this device'}</p>
              <p className="text-muted">{installed ? 'You are using the installed version.' : 'Works offline from your home screen.'}</p>
            </div>
            {canInstall && (
              <Button
                variant="primary"
                size="sm"
                icon={<Download className="h-4 w-4" />}
                onClick={async () => {
                  if (await install()) toast.success('Iron Will installed');
                }}
              >
                Install
              </Button>
            )}
          </Card>
        </section>
      )}

      <section>
        <SectionTitle title="Data management" />
        <DataManagement />
      </section>

      <section>
        <SectionTitle title="About app" />
        <Link to="/about">
          <Card className="flex items-center gap-3.5 transition hover:border-accent/40">
            <Info className="h-5 w-5 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {APP_NAME} v{APP_VERSION}
              </p>
              <p className="text-sm text-muted">About, privacy &amp; developer</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Card>
        </Link>
      </section>
    </div>
  );
}
