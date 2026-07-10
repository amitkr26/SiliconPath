import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "https://github.com/amitkr26/SiliconPath", label: "GitHub" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-text-tertiary">
          © {new Date().getFullYear()} SiliconPath. Open source under MIT License.
        </p>
        <ul className="flex flex-wrap justify-center gap-5">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-sm text-text-tertiary hover:text-text-secondary">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
