import { cn, initials } from "@/lib/utils";

// Only ever draws from the four core token hues (sentinel / amber / success
// / danger) so avatars never introduce off-palette colors into the UI.
const GRADIENTS = [
  "from-[#39A06E] to-[#2C7D57]",
  "from-[#FFB020] to-[#DB8F10]",
  "from-[#2ECC8F] to-[#1F9E6D]",
  "from-[#FF5470] to-[#D63A55]",
];

function hashSeed(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

interface AvatarProps {
  seed: string;
  name: string;
  size?: "sm" | "md" | "lg";
  ring?: boolean;
  className?: string;
}

const SIZES = { sm: "h-7 w-7 text-[10px]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-sm" };

export function Avatar({ seed, name, size = "md", ring, className }: AvatarProps) {
  const gradient = GRADIENTS[hashSeed(seed) % GRADIENTS.length];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white",
        gradient,
        SIZES[size],
        ring && "ring-2 ring-[color:var(--color-surface)] ring-offset-2 ring-offset-[color:var(--color-surface-2)]",
        className
      )}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
