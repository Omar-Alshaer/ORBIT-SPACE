const stars = [
  "left-[8%] top-[18%] h-1 w-1 delay-0",
  "left-[18%] top-[68%] h-0.5 w-0.5 delay-700",
  "left-[28%] top-[28%] h-1.5 w-1.5 delay-1000",
  "left-[41%] top-[12%] h-0.5 w-0.5 delay-500",
  "left-[52%] top-[78%] h-1 w-1 delay-300",
  "left-[63%] top-[35%] h-0.5 w-0.5 delay-1000",
  "left-[72%] top-[16%] h-1.5 w-1.5 delay-700",
  "left-[83%] top-[58%] h-1 w-1 delay-500",
  "left-[91%] top-[26%] h-0.5 w-0.5 delay-300",
  "left-[12%] top-[86%] h-1.5 w-1.5 delay-1000",
  "left-[35%] top-[55%] h-1 w-1 delay-700",
  "left-[78%] top-[88%] h-0.5 w-0.5 delay-0",
];

export function SpaceBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F7F8FA] transition-colors duration-500 dark:bg-orbit-ink"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,122,0,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(34,160,255,0.12),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F7F8FA_48%,#EEF3F8_100%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(255,122,0,0.16),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(80,167,255,0.16),transparent_24%),linear-gradient(180deg,#0D1117_0%,#10151F_48%,#070A0F_100%)]" />
      <div className="absolute inset-0 animate-star-drift bg-[radial-gradient(circle,rgba(13,17,23,0.18)_1px,transparent_1.5px)] bg-[length:92px_92px] opacity-40 dark:bg-[radial-gradient(circle,rgba(255,255,255,0.48)_1px,transparent_1.5px)] dark:opacity-50" />
      <div className="absolute inset-0 animate-star-drift bg-[radial-gradient(circle,rgba(255,122,0,0.22)_1px,transparent_1.8px)] bg-[length:148px_148px] opacity-40 [animation-duration:52s] dark:bg-[radial-gradient(circle,rgba(255,179,71,0.5)_1px,transparent_1.8px)] dark:opacity-30" />
      <div className="absolute left-1/2 top-1/2 h-[72vmin] w-[72vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orbit-coal/8 dark:border-white/10" />
      <div className="absolute left-1/2 top-1/2 h-[92vmin] w-[92vmin] -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-full border border-orange-400/14 dark:border-orange-300/10" />
      <div className="absolute left-[18%] top-[16%] h-40 w-40 rounded-full bg-orange-500/14 blur-3xl dark:bg-orange-500/10" />
      <div className="absolute bottom-[-12%] right-[8%] h-72 w-72 rounded-full bg-sky-400/14 blur-3xl dark:bg-sky-400/10" />
      {stars.map((star) => (
        <span
          className={`absolute animate-twinkle rounded-full bg-orbit-coal/45 shadow-[0_0_14px_rgba(13,17,23,0.18)] dark:bg-white dark:shadow-[0_0_14px_rgba(255,255,255,0.85)] ${star}`}
          key={star}
        />
      ))}
    </div>
  );
}
