import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '#/components/ui/button'

const navLinkClass =
  'text-muted-foreground hover:text-foreground border border-transparent focus-visible:ring-ring rounded-md px-4 py-2 text-sm uppercase tracking-[0.24em] transition-colors outline-none focus-visible:ring-2'
const activeNavLinkClass =
  'bg-accent text-accent-foreground border-border shadow-xs'

export function SiteHeader() {
  return (
    <header className="bg-card border-accent-foreground/20 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto grid min-h-16 max-w-md grid-cols-[1fr_auto_1fr] items-center gap-3 px-6">
        <div aria-hidden />
        <nav
          aria-label="Primary"
          className="flex items-center justify-center gap-2"
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
        <div className="justify-self-end">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  )
}
