import type { ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ClerkProvider } from '@clerk/tanstack-react-start'
import appCss from '../styles.css?url'
import { ConvexClientProvider } from '#/lib/convex'
import { appEnv } from '#/lib/env'
import { SiteHeader } from '#/components/site-header'

const appName = import.meta.env.VITE_APP_NAME?.trim() || 'Clerk Convex TanStack'
const appDescription =
  import.meta.env.VITE_APP_DESCRIPTION?.trim() || 'Base starter template.'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: appName,
      },
      {
        name: 'description',
        content: appDescription,
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  const publishableKey = appEnv.clerkPublishableKey

  if (!publishableKey) {
    throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <RootDocument>{children}</RootDocument>
    </ClerkProvider>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body
        className="font-sans antialiased wrap-anywhere selection:bg-[rgba(79,184,178,0.24)] text-balance h-full"
        suppressHydrationWarning
      >
        <ConvexClientProvider>
          <SiteHeader />
          {children}
          {import.meta.env.DEV ? (
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          ) : null}
        </ConvexClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
