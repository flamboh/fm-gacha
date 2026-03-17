const readOptionalEnv = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export const appEnv = {
  appName: readOptionalEnv(import.meta.env.VITE_APP_NAME) ?? 'Starter App',
  appDescription:
    readOptionalEnv(import.meta.env.VITE_APP_DESCRIPTION) ??
    'Reusable TanStack Start, Convex, Clerk, Tailwind base repo.',
  convexUrl: readOptionalEnv(import.meta.env.VITE_CONVEX_URL),
  clerkPublishableKey: readOptionalEnv(
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  ),
}

export const integrationStatus = {
  clerk: Boolean(appEnv.clerkPublishableKey),
  convex: Boolean(appEnv.convexUrl),
}
