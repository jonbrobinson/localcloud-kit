import Image from "next/image";

const SIZE_CLASSES = {
  sm: "h-7",
  md: "h-9",
} as const;

interface ManageHeaderBrandProps {
  /** Logo height — "sm" (28px) for compact bars like the dashboard nav, "md" (36px, default) for manage pages. */
  size?: keyof typeof SIZE_CLASSES;
}

/**
 * Brand mark for manage / secondary pages — same asset as the dashboard (`/logo.svg`).
 * `unoptimized` keeps SVG rendering reliable across Next/Image + CSP setups.
 */
export default function ManageHeaderBrand({ size = "md" }: ManageHeaderBrandProps) {
  return (
    <Image
      src="/logo.svg"
      alt="LocalCloud Kit"
      width={90}
      height={36}
      className={`${SIZE_CLASSES[size]} w-auto shrink-0 object-contain object-left`}
      priority
      unoptimized
    />
  );
}
