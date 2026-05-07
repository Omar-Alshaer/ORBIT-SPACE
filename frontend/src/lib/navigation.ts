import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CircleUserRound,
  Droplets,
  Flame,
  Gauge,
  HeartPulse,
  Home,
  Timer,
  UsersRound,
} from "lucide-react";

export type AppRoute = {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
};

export const appRoutes: AppRoute[] = [
  {
    description: "Your daily command center.",
    href: "/dashboard",
    icon: Home,
    label: "Dashboard",
  },
  {
    description: "Proof-based healthy challenges.",
    href: "/missions",
    icon: Flame,
    label: "Missions",
  },
  {
    description: "Pomodoro sessions with momentum.",
    href: "/focus",
    icon: Timer,
    label: "Focus",
  },
  {
    description: "Hydration, sleep, and movement.",
    href: "/health",
    icon: HeartPulse,
    label: "Health",
  },
  {
    description: "Orbit groups and Galaxies.",
    href: "/community",
    icon: UsersRound,
    label: "Community",
  },
  {
    description: "Identity, HP, streaks, and badges.",
    href: "/profile",
    icon: CircleUserRound,
    label: "Profile",
  },
];

export const dashboardStats = [
  {
    icon: Droplets,
    label: "Hydration",
    value: "6 / 8",
    tone: "from-sky-400 to-cyan-200",
  },
  {
    icon: Timer,
    label: "Focus",
    value: "45m",
    tone: "from-orange-500 to-amber-300",
  },
  {
    icon: Activity,
    label: "Movement",
    value: "4.8k",
    tone: "from-emerald-400 to-lime-200",
  },
  {
    icon: Gauge,
    label: "HP Today",
    value: "+120",
    tone: "from-fuchsia-400 to-orange-300",
  },
];
