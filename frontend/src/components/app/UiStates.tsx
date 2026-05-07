import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: LucideIcon;
  title: string;
};

type ErrorNoticeProps = {
  message: string;
};

type LoadingPanelProps = {
  description?: string;
  rows?: number;
  title: string;
};

export function EmptyState({
  action,
  description,
  icon: Icon = Sparkles,
  title,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/[0.025] p-5 text-center dark:border-white/10 dark:bg-white/[0.035]">
      <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500/12 text-orbit-orange">
        <Icon aria-hidden size={20} />
      </span>
      <h3 className="mt-4 text-base font-black text-orbit-coal dark:text-white">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-orbit-coal/55 dark:text-white/55">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorNotice({ message }: ErrorNoticeProps) {
  return (
    <section className="rounded-lg border border-orange-300/25 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orbit-coal dark:text-white">
      <span className="inline-flex items-start gap-2">
        <AlertCircle aria-hidden className="mt-0.5 shrink-0 text-orbit-orange" size={16} />
        <span>{message}</span>
      </span>
    </section>
  );
}

export function LoadingPanel({
  description = "Preparing your latest progress.",
  rows = 3,
  title,
}: LoadingPanelProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500/12 text-orbit-orange">
          <Loader2 aria-hidden className="animate-spin" size={20} />
        </span>
        <div>
          <h3 className="text-lg font-black text-orbit-coal dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm font-bold text-orbit-coal/52 dark:text-white/52">
            {description}
          </p>
        </div>
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className="h-14 animate-pulse rounded-lg bg-black/[0.045] dark:bg-white/[0.06]"
          key={index}
        />
      ))}
    </div>
  );
}

export function SkeletonMetricGrid() {
  return (
    <section className="grid gap-3 xl:col-span-2 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <article
          className="rounded-lg border border-black/10 bg-white/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
          key={index}
        >
          <div className="h-10 w-10 animate-pulse rounded-lg bg-black/[0.055] dark:bg-white/[0.07]" />
          <div className="mt-4 h-3 w-24 animate-pulse rounded-full bg-black/[0.055] dark:bg-white/[0.07]" />
          <div className="mt-3 h-8 w-20 animate-pulse rounded-full bg-black/[0.055] dark:bg-white/[0.07]" />
        </article>
      ))}
    </section>
  );
}
