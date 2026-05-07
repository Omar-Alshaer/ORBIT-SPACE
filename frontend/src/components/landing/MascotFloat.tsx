import Image from "next/image";

type MascotFloatProps = {
  alt: string;
  className?: string;
  priority?: boolean;
  src: string;
};

export function MascotFloat({
  alt,
  className = "",
  priority = false,
  src,
}: MascotFloatProps) {
  return (
    <div className={className}>
      <div className="animate-float drop-shadow-[0_24px_45px_rgba(0,0,0,0.35)]">
        <Image
          alt={alt}
          className="h-auto w-full select-none"
          height={520}
          priority={priority}
          src={src}
          width={520}
        />
      </div>
    </div>
  );
}
