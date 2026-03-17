import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/clerk-react'
import { appEnv } from '#/lib/env'

export default function AppClerkProvider({
  children,
}: {
  children: ReactNode
}) {
  if (!appEnv.clerkPublishableKey) {
    return <>{children}</>
  }

  return (
    <ClerkProvider
      publishableKey={appEnv.clerkPublishableKey}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  )
}
