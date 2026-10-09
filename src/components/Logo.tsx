import Image from "next/image";

/**
 * The supplied mark, trimmed of its 3000px canvas padding.
 * "light" recolours only the charcoal TENNIS ACADEMY lockup to off-white for
 * dark backgrounds; emerald, sky and the gold ball are untouched in both.
 */
export default function Logo({
  variant = "light",
  className = "",
  priority = false,
}: {
  variant?: "light" | "dark";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={variant === "light" ? "/logo-light.png" : "/logo.png"}
      alt="Serve & Beyond Tennis Academy"
      // 840×302 (3x the 280px display width, for retina) — was 2500×900,
      // an oversized source that was both the homepage's LCP element and
      // its biggest single waste of bytes (32 of 36 KiB unused at the
      // rendered size, per the CTO audit).
      width={840}
      height={302}
      priority={priority}
      sizes="280px"
      className={className}
    />
  );
}
