import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useToast } from '@/components/ui/Toast';

/** Shown only when the browser says the app can be installed. */
export function InstallBanner() {
  const { canInstall, install } = useInstallPrompt();
  const toast = useToast();
  if (!canInstall) return null;
  return (
    <Card className="flex items-center gap-3 !p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
        <Download className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Install Iron Will</p>
        <p className="text-xs text-muted">Add it to your home screen and use it offline.</p>
      </div>
      <Button
        size="sm"
        variant="primary"
        onClick={async () => {
          const ok = await install();
          if (ok) toast.success('Iron Will installed');
        }}
      >
        Install
      </Button>
    </Card>
  );
}
