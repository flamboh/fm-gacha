import type { ReactNode } from 'react'
import { ConvexProvider } from 'convex/react'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { appEnv } from '#/lib/env'

const convexQueryClient = new ConvexQueryClient(appEnv.convexUrl)

export default function AppConvexProvider({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ConvexProvider client={convexQueryClient.convexClient}>
      {children}
    </ConvexProvider>
  )
}
