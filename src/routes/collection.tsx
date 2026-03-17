import { useEffect, useState, useRef } from 'react'
import type { JSX } from 'react'
import { SignUp, useAuth } from '@clerk/tanstack-react-start'
import { CaretDownIcon, CircleNotchIcon } from '@phosphor-icons/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { TrackCardFace } from '#/components/track-card-face'
import { buttonVariants } from '#/components/ui/button'
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
import { AnimatePresence, motion, LayoutGroup } from 'motion/react'

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
  const [inspectedCardId, setInspectedCardId] = useState<string | null>(null)
  const summary = useQuery(api.collection.getSummary, userId ? {} : 'skip')
  const { results, status, loadMore } = usePaginatedQuery(
    api.collection.listPage,
    userId
      ? {
          sort,
        }
      : 'skip',
    { initialNumItems: 20 },
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

  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loadMoreRef.current || status !== 'CanLoadMore') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore(20)
        }
      },
      { rootMargin: '400px' },
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [status, loadMore])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectedCardId(null)
    }
    if (inspectedCardId) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [inspectedCardId])

  const inspectedCard = inspectedCardId
    ? results.find((r) => r._id === inspectedCardId)
    : null

  return (
    <LayoutGroup>
      <main className="bg-background text-foreground min-h-[calc(100dvh-4rem)] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div
              className="collection-enter space-y-3"
              style={{ animationDelay: '40ms' }}
            >
              <h1 className="text-3xl uppercase tracking-[0.16em] text-balance">
                Collection
              </h1>
              <div className="flex flex-wrap gap-2 text-sm">
                {summaryItems.map((item, index) => (
                  <span
                    key={item.label}
                    className="collection-enter text-muted-foreground inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 tabular-nums"
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
                    'bg-card border-border min-w-40 justify-between rounded-xl px-3 text-sm uppercase tracking-[0.16em] shadow-[0_10px_24px_-20px_rgba(0,0,0,0.9)] transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:ring-2 focus-visible:ring-ring data-popup-open:border-ring/35 data-popup-open:shadow-[0_16px_32px_-24px_rgba(0,0,0,0.95)]',
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
                      onValueChange={(value) =>
                        setSort(value as CollectionSort)
                      }
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
              className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              {results.map((entry, index) => (
                <button
                  key={entry._id}
                  onClick={() => setInspectedCardId(entry._id)}
                  className="collection-enter text-left w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[1.5rem] active:scale-[0.96] transition-transform duration-200"
                  style={{
                    animationDelay: `${160 + (index % 20) * 30}ms`,
                  }}
                >
                  <motion.div
                    layoutId={`card-${entry._id}`}
                    transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                    style={
                      inspectedCardId === entry._id ? { opacity: 0 } : undefined
                    }
                    className="h-full"
                  >
                    <Card className="bg-card text-card-foreground overflow-hidden rounded-[1.5rem] border border-border/70 py-0 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)] transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-1 hover:border-ring/35 hover:shadow-[0_26px_54px_-28px_rgba(0,0,0,0.82)] aspect-[2/3] h-full">
                      <CardContent className="p-2 h-full">
                        <TrackCardFace
                          card={entry}
                          headerRight={`x${entry.copyCount}`}
                          stopTitleClickPropagation
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </button>
              ))}
            </section>
          ) : null}

          {status === 'CanLoadMore' || status === 'LoadingMore' ? (
            <div
              ref={loadMoreRef}
              className="collection-enter flex justify-center py-8"
              style={{ animationDelay: '220ms' }}
            >
              {status === 'LoadingMore' ? (
                <div className="text-muted-foreground flex items-center gap-3 text-xs uppercase tracking-[0.22em]">
                  <CircleNotchIcon className="size-5 animate-spin" />
                  <span>Loading more...</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <AnimatePresence>
            {inspectedCard && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setInspectedCardId(null)}
                  className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 cursor-pointer"
                />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 pointer-events-none">
                  <motion.div
                    layoutId={`card-${inspectedCard._id}`}
                    transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
                    className="w-full max-w-sm pointer-events-auto outline-none"
                  >
                    <a
                      href={inspectedCard.lastFmUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="cursor-pointer block group active:scale-[0.98] transition-transform duration-200 h-full"
                    >
                      <Card className="bg-card text-card-foreground overflow-hidden rounded-[2.1rem] border border-border/70 py-0 shadow-[0_26px_54px_-28px_rgba(0,0,0,0.82)] aspect-[2/3] h-full transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:-translate-y-1 group-hover:border-ring/35 group-hover:shadow-[0_32px_64px_-32px_rgba(0,0,0,0.9)]">
                        <CardContent className="p-3 h-full">
                          <TrackCardFace
                            card={inspectedCard}
                            headerRight={`x${inspectedCard.copyCount}`}
                          />
                        </CardContent>
                      </Card>
                    </a>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </main>
    </LayoutGroup>
  )
}
