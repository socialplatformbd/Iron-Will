import { TelegramIcon, WhatsAppIcon } from '@/components/ui/BrandIcons';
import { ExternalLinkButton } from '@/components/ui/ExternalLinkButton';
import { TELEGRAM_URL, WHATSAPP_URL } from '@/data/constants';

export function CommunityButtons({ onJoin }: { onJoin?: () => void }) {
  return (
    <div className="space-y-3">
      <ExternalLinkButton href={TELEGRAM_URL} brand="telegram" icon={<TelegramIcon className="h-5 w-5" />} onClick={onJoin}>
        Join Telegram Channel
      </ExternalLinkButton>
      <ExternalLinkButton href={WHATSAPP_URL} brand="whatsapp" icon={<WhatsAppIcon className="h-5 w-5" />} onClick={onJoin}>
        Join WhatsApp Group
      </ExternalLinkButton>
    </div>
  );
}
