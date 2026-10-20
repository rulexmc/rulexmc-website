import Image from "next/image";
import { avatarUrl } from "@/lib/avatar";

export function Avatar({ name, size = 40, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <Image
      src={avatarUrl(name, size * 2)}
      alt={`${name}'s Minecraft avatar`}
      width={size}
      height={size}
      unoptimized
      className={`rounded-sm bg-ink-700 [image-rendering:pixelated] ${className}`}
    />
  );
}
