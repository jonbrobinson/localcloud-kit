import Image from "next/image";

/**
 * Brand mark for manage / secondary pages — same asset as the dashboard (`/logo.svg`).
 * `unoptimized` keeps SVG rendering reliable across Next/Image + CSP setups.
 */
export default function ManageHeaderBrand() {
  return (
    <Image
      src="/logo.svg"
      alt="LocalCloud Kit"
      width={90}
      height={36}
      className="h-9 w-auto shrink-0 object-contain object-left"
      priority
      unoptimized
    />
  );
}
