import { Link } from 'react-router-dom';
import { Award, ChevronRight } from 'lucide-react';
import { Card, EmptyState, SectionTitle } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/time';

export function RecentAchievements() {
  const { achievements } = useApp();
  const recent = achievements.slice(0, 3);
  return (
    <section>
      <SectionTitle
        title="Recent achievements"
        action={
          <Link to="/achievements" className="flex items-center gap-0.5 text-xs font-semibold text-accent">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <Card padded={false}>
        {recent.length === 0 ? (
          <EmptyState icon={<Award className="h-7 w-7" />} title="No badges yet" text="Your first badge unlocks after 1 clean day. Every badge you earn stays yours forever." />
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-accent text-onaccent">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{a.title}</div>
                  <div className="text-xs text-muted">
                    {a.days} {a.days === 1 ? 'day' : 'days'} · {formatDate(a.unlockedAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
