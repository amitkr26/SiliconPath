import Link from "next/link";
import { tokens } from "@/lib/design/tokens";

/**
 * The ONE brand component. Navbar, auth pages, emails, OG images all use this —
 * so the old name can never leak through on a page that hand-rolled its own header
 * (a real bug in the prior build).
 */
export function Brand({ size = 20 }: { size?: number }) {
  return (
    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          background: `linear-gradient(135deg, ${tokens.color.accent}, #0EA5E9)`,
          display: "inline-block",
        }}
      />
      <span style={{ fontFamily: tokens.font.display, fontWeight: 700, fontSize: size, color: tokens.color.text }}>
        Silicon<span style={{ color: tokens.color.accent }}>Path</span>
      </span>
    </Link>
  );
}
