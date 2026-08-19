import { Leaf } from "lucide-react";
import { useState } from "react";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: "square" | "4/3" | "3/2";
}

const GRADIENT_PALETTES = [
  { from: "#EAF8F0", to: "#D4F1E4", icon: "#00A651" },
  { from: "#FFF8E7", to: "#FFE9B8", icon: "#D4A017" },
  { from: "#FFF0F0", to: "#FFD9D9", icon: "#E05050" },
  { from: "#F0F8FF", to: "#D6ECFF", icon: "#3B82F6" },
  { from: "#FAF0FF", to: "#EDD6FF", icon: "#9B59B6" },
];

export function ProductImage({
  src,
  alt,
  className = "",
  aspectRatio = "square",
}: ProductImageProps) {
  const [imgError, setImgError] = useState(false);

  const aspectClass =
    aspectRatio === "4/3"
      ? "aspect-[4/3]"
      : aspectRatio === "3/2"
      ? "aspect-[3/2]"
      : "aspect-square";

  // Pick a consistent palette based on alt text
  const paletteIndex =
    alt.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    GRADIENT_PALETTES.length;
  const palette = GRADIENT_PALETTES[paletteIndex];

  if (src && !imgError) {
    return (
      <div className={`${aspectClass} overflow-hidden ${className}`}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Premium placeholder
  return (
    <div
      className={`${aspectClass} flex items-center justify-center relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
      aria-label={`Image placeholder for ${alt}`}
    >
      {/* Decorative organic circle */}
      <div
        className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-30"
        style={{ background: palette.icon }}
      />
      <div
        className="absolute -top-3 -left-3 w-12 h-12 rounded-full opacity-20"
        style={{ background: palette.icon }}
      />

      {/* Leaf icon */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        <Leaf
          size={28}
          strokeWidth={1.5}
          style={{ color: palette.icon }}
          className="opacity-70"
        />
      </div>
    </div>
  );
}
