import {
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Home,
  Mail,
  Settings,
  Siren,
  Sprout,
  Target,
  Timer,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/progress', label: 'Progress', icon: Timer },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/achievements', label: 'Badges', icon: Award },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const SECONDARY_NAV: NavItem[] = [
  { to: '/emergency', label: 'Emergency', icon: Siren },
  { to: '/tree', label: 'Habit Tree', icon: Sprout },
  { to: '/focus', label: 'Focus Mode', icon: Target },
  { to: '/coach', label: 'AI Coach', icon: Bot },
  { to: '/history', label: 'History', icon: BarChart3 },
  { to: '/letters', label: 'Letters', icon: Mail },
];

/** Routes that render without navigation chrome for a distraction-free experience. */
export const IMMERSIVE_ROUTES = ['/emergency', '/focus'];
