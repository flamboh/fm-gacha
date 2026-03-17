import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import type { CSSProperties, JSX, KeyboardEvent } from 'react'
import { Card, CardContent } from '#/components/ui/card'

export type PackCarouselCard = {
  slot: number
  title: string
  artist: string
  artistGenres?: string[]
  album?: string
  lastFmUrl: string
  listeners: number
  playcount: number
  playListenerRatio?: number
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic'
}

type PackCarouselProps = {
  cards: PackCarouselCard[]
  selectedIndex: number
  transitioningFromIndex: number | null
  canShowNext: boolean
  canShowPrevious: boolean
  onShowNext: () => void
  onShowPrevious: () => void
}

type ArrowButtonProps = {
  className: string
  direction: 'left' | 'right'
  disabled: boolean
  onClick: () => void
}

type TrackCardContentProps = {
  card: PackCarouselCard
}

const playingCardClass =
  'bg-card text-card-foreground h-full w-full overflow-hidden rounded-[1.75rem] border-2 border-border/70 py-0 text-left shadow-[0_24px_60px_-36px_rgba(0,0,0,0.9)]'

const rarityCopy = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  mythic: 'Mythic',
} satisfies Record<PackCarouselCard['rarity'], string>

export function PackCarousel({
  cards,
  selectedIndex,
  transitioningFromIndex,
  canShowNext,
  canShowPrevious,
  onShowNext,
  onShowPrevious,
}: PackCarouselProps): JSX.Element {
  const visibleStackCards = cards.map((card, index) => ({
    card,
    index,
    offset: index - selectedIndex,
  }))

  function handleCurrentCardKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ): void {
    if (!canShowNext || (event.key !== 'Enter' && event.key !== ' ')) return

    event.preventDefault()
    onShowNext()
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-muted-foreground text-center text-sm uppercase tracking-[0.28em]">
        {selectedIndex + 1}/{cards.length}
      </p>

      <div className="relative w-full px-8 sm:px-10 md:px-14">
        <ArrowButton
          direction="left"
          disabled={!canShowPrevious}
          onClick={onShowPrevious}
          className="left-0"
        />

        <ArrowButton
          direction="right"
          disabled={!canShowNext}
          onClick={onShowNext}
          className="right-0"
        />

        <div className="pb-8">
          <div className="relative mx-auto h-[27.5rem] w-[19.5rem] overflow-visible">
            {visibleStackCards.map(({ card, index, offset }) => {
              const isCurrentCard = offset === 0

              return (
                <div
                  key={card.slot}
                  role={isCurrentCard ? 'button' : undefined}
                  tabIndex={isCurrentCard && canShowNext ? 0 : -1}
                  onClick={
                    isCurrentCard && canShowNext ? onShowNext : undefined
                  }
                  onKeyDown={
                    isCurrentCard ? handleCurrentCardKeyDown : undefined
                  }
                  aria-disabled={isCurrentCard ? !canShowNext : undefined}
                  aria-hidden={isCurrentCard ? undefined : true}
                  className={`absolute left-1/2 top-0 transition-all duration-200 ease-out ${isCurrentCard ? 'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background' : 'pointer-events-none'}`}
                  style={getStackCardStyle(
                    index,
                    offset,
                    selectedIndex,
                    transitioningFromIndex,
                  )}
                >
                  <div
                    className={`relative h-[27.5rem] w-[19.5rem] transition-transform duration-150 ${isCurrentCard ? 'group cursor-pointer hover:scale-[1.02] hover:-translate-y-2 active:scale-95' : ''}`}
                  >
                    <Card className={playingCardClass}>
                      <CardContent className="relative flex h-full min-h-0 flex-col justify-between p-5 sm:p-6">
                        <div
                          aria-hidden
                          className="absolute inset-3 rounded-[1.35rem] border border-border"
                        />
                        <TrackCardContent card={card} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function getStackCardStyle(
  index: number,
  offset: number,
  selectedIndex: number,
  transitioningFromIndex: number | null,
): CSSProperties {
  const depth = Math.abs(offset)
  const direction = offset < 0 ? -1 : 1
  let zIndex = 20 - depth

  if (transitioningFromIndex === index) {
    zIndex = 29
  }

  if (index === selectedIndex) {
    zIndex = 30
  }

  return {
    transform: `translateX(calc(-50% + ${direction * depth * 16}px)) translateY(${depth * 8}px) scale(${1 - depth * 0.03}) rotate(${direction * depth * 2}deg)`,
    zIndex,
  }
}

function TrackCardContent({ card }: TrackCardContentProps): JSX.Element {
  return (
    <>
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-[0.65rem] uppercase tracking-[0.28em]">
            {rarityCopy[card.rarity]}
          </p>
          <p className="text-muted-foreground text-[0.65rem] uppercase tracking-[0.28em]">
            card {card.slot}
          </p>
        </div>
        <p className="text-muted-foreground text-[0.65rem] uppercase tracking-[0.28em]">
          fm
        </p>
      </div>
      <div className="relative flex flex-1 flex-col justify-center gap-4 py-4">
        <a
          href={card.lastFmUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          className="block text-3xl font-semibold tracking-tight underline-offset-4 hover:underline focus:underline focus:outline-none"
        >
          {card.title}
        </a>
        <p className="text-muted-foreground text-sm uppercase tracking-[0.18em]">
          {card.artist}
        </p>
        {card.album ? (
          <p className="text-muted-foreground text-sm">{card.album}</p>
        ) : null}
      </div>
      <div className="relative space-y-2 text-sm">
        <p>{formatCount(card.listeners)} listeners</p>
        <p>{formatCount(card.playcount)} plays</p>
        {card.playListenerRatio !== undefined ? (
          <p>{formatRatio(card.playListenerRatio)} plays/listener</p>
        ) : null}
        {card.artistGenres?.length ? (
          <p className="text-muted-foreground">
            {formatGenres(card.artistGenres)}
          </p>
        ) : null}
      </div>
    </>
  )
}

function ArrowButton({
  className,
  direction,
  disabled,
  onClick,
}: ArrowButtonProps): JSX.Element {
  return (
    <button
      type="button"
      aria-label={
        direction === 'left' ? 'Show previous card' : 'Show next card'
      }
      onClick={onClick}
      disabled={disabled}
      className={`${className} absolute top-1/2 z-30 flex h-28 w-10 -translate-y-1/2 items-center justify-center rounded-[1.5rem] border border-border/70 bg-card/80 text-foreground shadow-[0_18px_40px_-28px_rgba(0,0,0,0.95)] backdrop-blur-sm transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-35`}
    >
      {direction === 'left' ? (
        <CaretLeft size={28} weight="light" />
      ) : (
        <CaretRight size={28} weight="light" />
      )}
    </button>
  )
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatGenres(genres: string[]): string {
  return genres.slice(0, 3).join(' · ')
}

function formatRatio(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)
}
