import Link from "next/link";

const navItems = [
  "Product",
  "Solutions",
  "Pricing",
  "Resources",
  "Company",
];

export function MarketingNavbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">T</span>
          <span>Telefya</span>
        </Link>

        <nav className="nav-links">
          {navItems.map((item) => (
            <Link key={item} href={`/#${item.toLowerCase()}`}>
              {item}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link href="/login">Sign in</Link>
          <Link href="/register" className="nav-cta">
            Start for free
          </Link>
        </div>
      </div>
    </header>
  );
}