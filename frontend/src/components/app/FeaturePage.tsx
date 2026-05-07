import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, CheckCircle2, CircleDashed, Sparkles } from "lucide-react";

type FeatureMetric = {
  label: string;
  value: string;
  helper?: string;
};

type FeatureItem = {
  label: string;
  meta: string;
  state: string;
};

type FeaturePanel = {
  icon: LucideIcon;
  label: string;
  value: string;
};

type FeaturePageProps = {
  body: string;
  items: FeatureItem[];
  mascot: string;
  metrics: FeatureMetric[];
  panels: FeaturePanel[];
  primaryAction: string;
  title: string;
};

export function FeaturePage({
  body,
  items,
  mascot,
  metrics,
  panels,
  primaryAction,
  title,
}: FeaturePageProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_390px] 2xl:grid-cols-[1fr_440px]">
      <section className="min-w-0 overflow-hidden rounded-lg border border-black/10 bg-white/78 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
        <div className="grid gap-8 lg:grid-cols-[1fr_260px] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-orbit-orange">
              ORBIT workspace
            </p>
            <h2 className="mt-3 max-w-[16.5rem] break-words text-[2rem] font-black leading-[1.02] text-orbit-coal dark:text-white sm:max-w-4xl sm:text-5xl xl:text-6xl">
              {title}
            </h2>
            <p className="mt-5 max-w-[16.5rem] text-sm leading-7 text-orbit-coal/64 dark:text-white/64 sm:max-w-2xl">
              {body}
            </p>
            <div className="mt-6 flex max-w-[16.5rem] flex-col gap-3 sm:max-w-none sm:flex-row">
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orbit-orange to-orbit-amber px-5 text-sm font-black text-orbit-coal shadow-orbit transition hover:-translate-y-0.5"
                type="button"
              >
                {primaryAction}
                <ArrowUpRight aria-hidden size={17} />
              </button>
              <button
                className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white/70 px-5 text-sm font-black text-orbit-coal transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
                type="button"
              >
                View history
              </button>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[230px] sm:max-w-[260px]">
            <div className="absolute inset-3 rounded-full border border-dashed border-orbit-orange/28" />
            <Image
              alt={`${title} mascot`}
              className="absolute inset-0 h-full w-full object-contain drop-shadow-2xl"
              height={320}
              priority
              src={mascot}
              width={320}
            />
          </div>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-lg border border-black/10 bg-gradient-to-br from-orbit-orange to-orbit-amber p-5 text-orbit-coal shadow-orbit">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase">Momentum score</p>
            <p className="mt-7 text-6xl font-black leading-none">82%</p>
            <p className="mt-3 text-sm font-bold text-orbit-coal/70">
              Updated from today&apos;s activity
            </p>
          </div>
          <Sparkles aria-hidden size={34} />
        </div>
        <div className="mt-8 h-2 rounded-full bg-white/34">
          <div className="h-full w-[82%] rounded-full bg-orbit-coal" />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 xl:col-span-2">
        {metrics.map((metric) => (
          <article
            className="rounded-lg border border-black/10 bg-white/78 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
            key={metric.label}
          >
            <p className="text-sm font-bold text-orbit-coal/55 dark:text-white/55">
              {metric.label}
            </p>
            <p className="mt-2 text-3xl font-black text-orbit-coal dark:text-white">
              {metric.value}
            </p>
            {metric.helper ? (
              <p className="mt-2 text-xs font-bold text-orbit-coal/45 dark:text-white/45">
                {metric.helper}
              </p>
            ) : null}
          </article>
        ))}
      </section>

      <section className="min-w-0 rounded-lg border border-black/10 bg-white/78 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-black text-orbit-coal dark:text-white">
            Action queue
          </h3>
          <span className="text-sm font-black text-orbit-orange">
            {items.length} items
          </span>
        </div>
        <div className="mt-5 grid gap-3">
          {items.map((item, index) => (
            <article
              className="rounded-lg border border-black/10 bg-black/[0.025] px-4 py-4 dark:border-white/10 dark:bg-white/[0.035]"
              key={item.label}
            >
              <div className="flex items-start gap-3">
                {index === 0 ? (
                  <CheckCircle2
                    aria-hidden
                    className="mt-0.5 shrink-0 text-orbit-orange"
                    size={20}
                  />
                ) : (
                  <CircleDashed
                    aria-hidden
                    className="mt-0.5 shrink-0 text-orbit-coal/35 dark:text-white/35"
                    size={20}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-black text-orbit-coal dark:text-white">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-orbit-coal/58 dark:text-white/58">
                    {item.meta}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-black/[0.06] px-3 py-1 text-xs font-black text-orbit-coal/58 dark:bg-white/[0.08] dark:text-white/58">
                  {item.state}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {panels.map((panel) => {
          const Icon = panel.icon;

          return (
            <article
              className="rounded-lg border border-black/10 bg-white/78 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.055]"
              key={panel.label}
            >
              <Icon aria-hidden className="text-orbit-orange" size={24} />
              <p className="mt-5 text-sm font-bold text-orbit-coal/55 dark:text-white/55">
                {panel.label}
              </p>
              <p className="mt-2 text-2xl font-black text-orbit-coal dark:text-white">
                {panel.value}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
