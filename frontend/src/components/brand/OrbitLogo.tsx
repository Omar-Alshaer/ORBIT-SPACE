type OrbitLogoProps = {
  className?: string;
};

export function OrbitLogo({ className = "" }: OrbitLogoProps) {
  return (
    <span
      className={`inline-flex items-center font-black uppercase tracking-[0.18em] ${className}`}
      aria-label="ORBIT"
    >
      <span className="text-white dark:text-white">OR</span>
      <span className="bg-gradient-to-r from-orbit-orange to-orbit-amber bg-clip-text text-transparent">
        BIT
      </span>
    </span>
  );
}
