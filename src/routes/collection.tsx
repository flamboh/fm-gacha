import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { SignUp, useAuth } from '@clerk/tanstack-react-start'
import { CaretDownIcon, CircleNotchIcon } from '@phosphor-icons/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { TrackCardFace } from '#/components/track-card-face'
import { Button, buttonVariants } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'

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
  const activeSortLabel =
    sortOptions.find((option) => option.value === sort)?.label ?? 'Recent'
  const summaryItems = [
    { label: 'songs', value: summary?.uniqueSongs ?? 0 },
    { label: 'copies', value: summary?.totalCopies ?? 0 },
    { label: 'mythic', value: summary?.mythicCount ?? 0 },
    { label: 'rare', value: summary?.rareCount ?? 0 },
  ]

  return (
    <main className="bg-background text-foreground min-h-[calc(100dvh-4rem)] px-6 py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div
            className="collection-enter space-y-3"
            style={{ animationDelay: '40ms' }}
          >
            <p className="text-muted-foreground text-xs uppercase tracking-[0.28em]">
              Collection
            </p>
            <h1 className="text-3xl uppercase tracking-[0.16em] text-balance">
              Library
            </h1>
            <div className="flex flex-wrap gap-2 text-sm">
              {summaryItems.map((item, index) => (
                <span
                  key={item.label}
                  className="collection-enter text-muted-foreground inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 shadow-[0_10px_24px_-20px_rgba(0,0,0,0.9)] tabular-nums"
                  style={{ animationDelay: `${120 + index * 60}ms` }}
                >
                  <span className="text-foreground text-base leading-none font-semibold">
                    {item.value}
                  </span>
                  <span className="uppercase tracking-[0.18em]">
                    {item.label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div
            className="collection-enter flex flex-col gap-2 text-sm uppercase tracking-[0.2em]"
            style={{ animationDelay: '100ms' }}
          >
            <span className="text-muted-foreground">Sort</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'bg-card border-border min-w-40 justify-between rounded-xl px-3 text-sm uppercase tracking-[0.16em] shadow-[0_10px_24px_-20px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:border-ring/35 data-[popup-open]:shadow-[0_16px_32px_-24px_rgba(0,0,0,0.95)]',
                )}
              >
                <span>{activeSortLabel}</span>
                <CaretDownIcon className="size-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-card border-border w-40 rounded-xl border p-1 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.82)]"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-3 py-2 uppercase tracking-[0.18em]">
                    Sort
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={sort}
                    onValueChange={(value) => setSort(value as CollectionSort)}
                  >
                    {sortOptions.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.value}
                        value={option.value}
                        className="rounded-lg px-3 py-2 uppercase tracking-[0.16em]"
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {isLoading ? (
          <section
            aria-label="Loading collection"
            className="collection-enter flex min-h-[22rem] items-center justify-center"
            style={{ animationDelay: '160ms' }}
          >
            <div className="text-muted-foreground flex flex-col items-center gap-3 text-xs uppercase tracking-[0.22em]">
              <CircleNotchIcon
                aria-hidden="true"
                className="text-foreground size-8 animate-spin"
              />
              <span>Loading collection</span>
            </div>
          </section>
        ) : null}

        {isEmpty ? (
          <Card
            className="collection-enter"
            style={{ animationDelay: '160ms' }}
          >
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
          <section
            key={sort}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {results.map((entry, index) => (
              <Card
                key={entry._id}
                className="collection-enter bg-card text-card-foreground overflow-hidden rounded-[2.1rem] border border-border/70 py-0 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)] transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-1 hover:border-ring/35 hover:shadow-[0_26px_54px_-28px_rgba(0,0,0,0.82)]"
                style={{ animationDelay: `${160 + (index % 12) * 70}ms` }}
              >
                <CardContent className="p-3 h-full">
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
          <div
            className="collection-enter flex justify-center"
            style={{ animationDelay: '220ms' }}
          >
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
