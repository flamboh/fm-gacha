import type { JSX } from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/collection')({
  component: CollectionPage,
})

function CollectionPage(): JSX.Element {
  return <main className="min-h-[calc(100dvh-4rem)]" />
}
