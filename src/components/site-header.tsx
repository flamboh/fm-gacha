import { Link } from '@tanstack/react-router'

const navLinkClass =
  'text-muted-foreground hover:text-foreground border border-transparent focus-visible:ring-ring rounded-md px-4 py-2 text-sm uppercase tracking-[0.24em] transition-colors outline-none focus-visible:ring-2'
const activeNavLinkClass =
  'bg-accent text-accent-foreground border-border shadow-xs'

export function SiteHeader() {
  return (
    <header className="bg-background/95 border-border sticky top-0 z-20 border-b backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex min-h-16 max-w-md items-center justify-center gap-2 px-6"
      >
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className={navLinkClass}
          activeProps={{
            className: `${navLinkClass} ${activeNavLinkClass}`,
          }}
        >
          Gacha
        </Link>
        <Link
          to="/collection"
          className={navLinkClass}
          activeProps={{
            className: `${navLinkClass} ${activeNavLinkClass}`,
          }}
        >
          Collection
        </Link>
      </nav>
    </header>
  )
}
