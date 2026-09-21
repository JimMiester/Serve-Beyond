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
      width={2500}
      height={900}
      priority={priority}
      sizes="280px"
      className={className}
    />
  );
}
