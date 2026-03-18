import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '#/components/ui/button'

export function SiteHeader() {
  return (
    <header className="bg-card border-accent-foreground/20 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto grid min-h-16 max-w-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-6">
        <div aria-hidden />
        <nav
          aria-label="Primary"
          className="flex items-center justify-center gap-2"
        >
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="nav-link"
            activeProps={{ className: 'nav-link nav-link-active' }}
          >
            Gacha
          </Link>
          <Link
            to="/collection"
            className="nav-link"
            activeProps={{ className: 'nav-link nav-link-active' }}
          >
            Collection
          </Link>
          <Show when="signed-in">
            <Link
              to="/profile"
              className="nav-link"
              activeProps={{ className: 'nav-link nav-link-active' }}
            >
              Profile
            </Link>
          </Show>
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
