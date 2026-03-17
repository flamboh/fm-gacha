import type { ReactNode } from 'react'
import { ConvexProvider } from 'convex/react'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { appEnv } from '#/lib/env'

const convexQueryClient = appEnv.convexUrl
  ? new ConvexQueryClient(appEnv.convexUrl)
  : null

export default function AppConvexProvider({
  children,
}: {
  children: ReactNode
}) {
  if (!convexQueryClient) {
    return <>{children}</>
  }

  return (
    <ConvexProvider client={convexQueryClient.convexClient}>
      {children}
    </ConvexProvider>
  )
}
