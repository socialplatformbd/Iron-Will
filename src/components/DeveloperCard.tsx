import { Code2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CommunityButtons } from '@/components/CommunityButtons';
import { DEVELOPER_CREDIT, DEVELOPER_NAME } from '@/data/constants';

import { tr } from '@/i18n';
export function DeveloperCard({ showCommunity = false }: { showCommunity?: boolean }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-accent text-onaccent">
          <Code2 className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">{tr("Developer")}</div>
          <div className="text-lg font-bold leading-tight">{DEVELOPER_NAME}</div>
          <div className="text-sm text-muted">{tr(DEVELOPER_CREDIT)}</div>
        </div>
      </div>
      {showCommunity && (
        <div className="mt-5">
          <CommunityButtons />
        </div>
      )}
    </Card>
  );
}
