import { APP_NAME, APP_TAGLINE } from '@/data/constants';
import { tr, trn } from '@/i18n';

/** Draws a shareable badge image. Only the badge title and day count appear: no personal data. */
export async function renderBadgeCard(title: string, days: number): Promise<Blob> {
  const size = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(tr("Your browser cannot draw images."));

  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue('--accent').trim() || '#f59e0b';
  const accent2 = css.getPropertyValue('--accent-2').trim() || '#fb7185';
  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#1b1a22');
  bg.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const glow = ctx.createRadialGradient(size / 2, 430, 20, size / 2, 430, 520);
  glow.addColorStop(0, `${accent}55`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Shield
  const grad = ctx.createLinearGradient(0, 200, 0, 700);
  grad.addColorStop(0, accent2);
  grad.addColorStop(1, accent);
  ctx.save();
  ctx.translate(size / 2, 440);
  const s = 1.1;
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, -250);
  ctx.lineTo(180, -190);
  ctx.lineTo(180, -60);
  ctx.bezierCurveTo(180, 70, 100, 150, 0, 195);
  ctx.bezierCurveTo(-100, 150, -180, 70, -180, -60);
  ctx.lineTo(-180, -190);
  ctx.closePath();
  ctx.lineWidth = 18;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grad;
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = grad;
  ctx.font = `800 170px ${font}`;
  ctx.fillText(String(days), size / 2, 470);
  ctx.fillStyle = '#9b99aa';
  ctx.font = `600 42px ${font}`;
  ctx.fillText(days === 1 ? 'DAY' : 'DAYS', size / 2, 535);

  ctx.fillStyle = '#f4f3f7';
  ctx.font = `800 78px ${font}`;
  ctx.fillText(title.slice(0, 28), size / 2, 800);

  ctx.fillStyle = accent;
  ctx.font = `700 40px ${font}`;
  ctx.fillText(APP_NAME.toUpperCase(), size / 2, 930);
  ctx.fillStyle = '#9b99aa';
  ctx.font = `500 30px ${font}`;
  ctx.fillText(tr(APP_TAGLINE), size / 2, 980);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(tr("Could not create the image.")))), 'image/png');
  });
}

/** Share the image with the system share sheet, or download it when sharing files is unsupported. */
export async function shareBadgeCard(title: string, days: number): Promise<'shared' | 'downloaded'> {
  const blob = await renderBadgeCard(title, days);
  const file = new File([blob], `iron-will-${days}-days.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Iron Will', text: trn(days, '{title} · {n} day with Iron Will', '{title} · {n} days with Iron Will', { title }) });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}
