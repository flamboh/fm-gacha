import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { SignUp, useAuth } from '@clerk/tanstack-react-start'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { TrackCardFace } from '#/components/track-card-face'
import { Button, buttonVariants } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/collection')({
  component: CollectionPage,
})

type CollectionSort = 'recent' | 'artist' | 'title' | 'rarity'

const sortOptions: Array<{ label: string; value: CollectionSort }> = [
  { label: 'Recent', value: 'recent' },
  { label: 'Artist', value: 'artist' },
  { label: 'Title', value: 'title' },
  { label: 'Rarity', value: 'rarity' },
]

function CollectionPage(): JSX.Element {
  const { isLoaded, userId } = useAuth()
  const ensureViewer = useMutation(api.users.ensureViewer)
  const [sort, setSort] = useState<CollectionSort>('recent')
  const summary = useQuery(api.collection.getSummary, userId ? {} : 'skip')
  const { results, status, loadMore } = usePaginatedQuery(
    api.collection.listPage,
    userId
      ? {
          sort,
        }
      : 'skip',
    { initialNumItems: 12 },
  )

  useEffect(() => {
    if (!userId) {
      return
    }

    void ensureViewer({})
  }, [ensureViewer, userId])

  if (!isLoaded) {
    return <main className="min-h-[calc(100dvh-4rem)]" />
  }

  if (!userId) {
    return (
      <main className="bg-background flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-8">
        <SignUp />
      </main>
    )
  }

  const isEmpty = results.length === 0 && status !== 'LoadingFirstPage'
  const isLoading = status === 'LoadingFirstPage'

  return (
    <main className="bg-background text-foreground min-h-[calc(100dvh-4rem)] px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.28em]">
              Collection
            </p>
            <h1 className="text-3xl uppercase tracking-[0.16em]">Library</h1>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <span>{summary?.uniqueSongs ?? 0} songs</span>
              <span>{summary?.totalCopies ?? 0} copies</span>
              <span>{summary?.mythicCount ?? 0} mythic</span>
              <span>{summary?.rareCount ?? 0} rare</span>
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm uppercase tracking-[0.2em]">
            <span className="text-muted-foreground">Sort</span>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as CollectionSort)
              }
              className="bg-card border-border rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading collection...</p>
        ) : null}

        {isEmpty ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-[0.18em]">
                No songs yet
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <p className="text-muted-foreground">
                Open packs while signed in. Pulled songs land here
                automatically.
              </p>
              <Link to="/" className={buttonVariants({ size: 'lg' })}>
                Open a pack
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {results.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((entry) => (
              <Card
                key={entry._id}
                className="bg-card text-card-foreground overflow-hidden rounded-[1.75rem] border-2 border-border/70 py-0"
              >
                <CardContent className="p-3">
                  <TrackCardFace
                    card={entry}
                    headerRight={`x${entry.copyCount}`}
                  />
                </CardContent>
              </Card>
            ))}
          </section>
        ) : null}

        {status === 'CanLoadMore' || status === 'LoadingMore' ? (
          <div className="flex justify-center">
            <Button
              onClick={() => loadMore(12)}
              disabled={status === 'LoadingMore'}
              size="lg"
            >
              {status === 'LoadingMore' ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  )
}
