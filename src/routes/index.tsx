import { createFileRoute } from '@tanstack/react-router'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/clerk-react'
import { appEnv } from '#/lib/env'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim()

  return (
    <main className="min-h-screen px-6 py-6 md:px-10">
      <header className="flex items-center justify-between">
        <h1 className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--color-copy)]">
          {appEnv.appName}
        </h1>
        <HeaderAuthButton enabled={Boolean(clerkPublishableKey)} />
      </header>
    </main>
  )
}

function HeaderAuthButton({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--color-copy-soft)]"
      >
        Login
      </button>
    )
  }

  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--color-copy)] transition-colors hover:bg-white/10"
          >
            Login
          </button>
        </SignInButton>
      </SignedOut>
    </>
  )
}
