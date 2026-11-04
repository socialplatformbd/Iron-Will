import { Link } from 'react-router-dom';
import { ArrowLeft, Ban, HardDrive, Lock, ShieldCheck, WifiOff } from 'lucide-react';
import { Card, PageHeader, SectionTitle } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { DeveloperCard } from '@/components/DeveloperCard';
import { APP_NAME, APP_TAGLINE, APP_VERSION } from '@/data/constants';

const PRIVACY = [
  { icon: HardDrive, title: 'Stored on your device', text: 'Your timer, history, achievements and preferences are saved in IndexedDB and localStorage inside your own browser.' },
  { icon: Ban, title: 'No accounts, no servers', text: 'There is no login, no sign-up, no cloud database and no automatic synchronisation. Nothing personal is sent to the developer.' },
  { icon: Lock, title: 'You control your data', text: 'Export a JSON backup any time, import it on another device, or clear everything from Settings. Sharing is always your choice.' },
  { icon: WifiOff, title: 'Works offline', text: 'After the first load, the app shell is cached by a service worker so Iron Will keeps working without internet.' },
];

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <Link to="/settings" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <PageHeader title="About" />

      <Card glow className="text-center">
        <Logo size={80} className="mx-auto mb-4" />
        <h2 className="text-2xl font-extrabold tracking-[0.16em]">{APP_NAME.toUpperCase()}</h2>
        <p className="mt-1 text-sm font-medium text-accent">{APP_TAGLINE}</p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          Iron Will is a private, offline-first companion for breaking bad habits, building self-discipline and growing a little stronger every day.
        </p>
        <p className="mt-4 text-xs text-muted">Version {APP_VERSION}</p>
      </Card>

      <section>
        <SectionTitle title="Developer" />
        <DeveloperCard showCommunity />
      </section>

      <section>
        <SectionTitle title="Privacy" />
        <div className="grid gap-3 sm:grid-cols-2">
          {PRIVACY.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="!p-4">
                <Icon className="mb-2.5 h-5 w-5 text-accent" />
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{p.text}</p>
              </Card>
            );
          })}
        </div>
        <Card className="mt-3 flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <p className="text-sm leading-relaxed text-muted">
            <span className="font-semibold text-ink">Storage limitations.</span> Browsers decide how long site data is kept. Clearing browser or site data, uninstalling the app or running low on storage may erase your records, and persistence is requested but never guaranteed. Export a JSON backup regularly.
          </p>
        </Card>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Iron Will is a self-help tool, not medical advice. If you are struggling with addiction or your health, please speak with a qualified professional.
        </p>
      </section>
    </div>
  );
}
