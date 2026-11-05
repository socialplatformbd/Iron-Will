import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/utils/cn';
import { APP_NAME, APP_TAGLINE, DEVELOPER_CREDIT } from '@/data/constants';
import { IMMERSIVE_ROUTES, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from '@/layouts/navItems';
import { useEffect } from 'react';

import { tr } from '@/i18n';
function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium transition',
          isActive ? 'bg-accent/12 text-accent' : 'text-muted hover:bg-surface2 hover:text-ink'
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" />
      {tr(item.label)}
    </NavLink>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-elev/80 p-4 backdrop-blur-xl lg:flex">
      <div className="mb-6 flex items-center gap-3 px-1 pt-2">
        <Logo size={40} />
        <div>
          <div className="text-[15px] font-extrabold tracking-[0.16em]">{tr("IRON WILL")}</div>
          <div className="text-[11px] text-muted">{tr("Unbreakable")}</div>
        </div>
      </div>
      <nav className="space-y-1" aria-label={tr("Main")}>
        {PRIMARY_NAV.map((n) => (
          <SidebarLink key={n.to} item={{ ...n, label: n.to === '/achievements' ? 'Achievements' : n.label }} />
        ))}
      </nav>
      <div className="mb-2 mt-6 px-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{tr("Tools")}</div>
      <nav className="space-y-1" aria-label={tr("Tools")}>
        {SECONDARY_NAV.map((n) => (
          <SidebarLink key={n.to} item={n} />
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-line bg-surface p-3.5">
        <p className="text-xs font-semibold">{APP_NAME}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted">{tr(APP_TAGLINE)}</p>
        <p className="mt-2 text-[11px] text-muted">{tr(DEVELOPER_CREDIT)}</p>
      </div>
    </aside>
  );
}

function BottomNav() {
  return (
    <nav
      aria-label={tr("Main")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-elev/90 backdrop-blur-xl safe-bottom lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {PRIMARY_NAV.map((n) => {
          const Icon = n.icon;
          return (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition',
                    isActive ? 'text-accent' : 'text-muted'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId="nav-pill" className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                    )}
                    <Icon className="h-5 w-5" />
                    {tr(n.label)}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  const immersive = IMMERSIVE_ROUTES.includes(pathname);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="glow-bg min-h-dvh">
      {!immersive && <Sidebar />}
      <main className={cn('mx-auto w-full', !immersive && 'lg:pl-64')}>
        <div className={cn('mx-auto w-full max-w-5xl px-4 pt-[calc(env(safe-area-inset-top)+20px)] sm:px-6', immersive ? 'pb-10' : 'pb-28 lg:pb-12')}>
          <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
            <Outlet />
          </motion.div>
        </div>
      </main>
      {!immersive && <BottomNav />}
    </div>
  );
}
