import Image from "next/image";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-50 text-sm font-black text-telefya-blue",
        className
      )}
    >
      {src ? (
        <Image src={src} alt={name} fill sizes="44px" className="object-cover" />
      ) : (
        initials || "TF"
      )}
    </div>
  );
}