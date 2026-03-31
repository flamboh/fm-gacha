import type { JSX } from 'react'
import { cn } from '#/lib/utils'

export type TrackCardFaceData = {
  title: string
  artist: string
  artistGenres?: string[]
  album?: string
  lastFmUrl: string
  listeners: number
  playcount: number
  playListenerRatio?: number
  imageUrl?: string
  publishedAt?: string
  wikiSummary?: string
  sourceTag: string
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic'
}

type TrackCardFaceProps = {
  card: TrackCardFaceData
  headerRight: string
  className?: string
  stopTitleClickPropagation?: boolean
}

const rarityCopy = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  mythic: 'Mythic',
} satisfies Record<TrackCardFaceData['rarity'], string>

export function TrackCardFace({
  card,
  headerRight,
  className,
  stopTitleClickPropagation = false,
}: TrackCardFaceProps): JSX.Element {
  return (
    <div
      className={cn(
        'relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card',
        className,
      )}
    >
      <div className="border-b border-border/70 bg-accent/35 px-3 py-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-muted-foreground text-[0.55rem] uppercase tracking-[0.28em]">
              {rarityCopy[card.rarity]}
            </p>
            <p className="truncate text-xs font-semibold">{card.title}</p>
          </div>
          <p className="text-muted-foreground shrink-0 text-[0.55rem] uppercase tracking-[0.28em]">
            {headerRight}
          </p>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-end overflow-hidden border-b border-border/70 bg-background">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={`${card.title} cover art`}
            className="absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
          />
        ) : null}
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative flex h-full w-full flex-col justify-end gap-1.5 p-3">
          <a
            href={card.lastFmUrl}
            target="_blank"
            rel="noreferrer"
            onClick={
              stopTitleClickPropagation
                ? (event) => event.stopPropagation()
                : undefined
            }
            onKeyDown={
              stopTitleClickPropagation
                ? (event) => event.stopPropagation()
                : undefined
            }
            className="line-clamp-2 text-lg leading-tight font-semibold tracking-tight text-balance underline-offset-4 hover:underline focus:underline focus:outline-none"
          >
            {card.title}
          </a>
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-[0.65rem] uppercase tracking-[0.22em]">
              {card.artist}
            </p>
            {card.album ? (
              <p className="text-muted-foreground text-xs truncate">
                {card.album}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 border-b border-border/70 px-3 py-2">
        <div className="text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 text-[0.55rem] uppercase tracking-[0.22em]">
          <span>{card.sourceTag}</span>
          {card.publishedAt ? <span>{card.publishedAt}</span> : null}
        </div>
        {card.wikiSummary ? (
          <p className="line-clamp-2 text-xs leading-relaxed">
            {card.wikiSummary}
          </p>
        ) : null}
        {card.artistGenres?.length ? (
          <p className="text-muted-foreground line-clamp-1 text-[0.6rem] uppercase tracking-[0.18em]">
            {card.artistGenres.slice(0, 3).join(' · ')}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 divide-x divide-border/70 bg-background/80">
        <StatBlock label="Listeners" value={formatCount(card.listeners)} />
        <StatBlock label="Plays" value={formatCount(card.playcount)} />
      </div>
    </div>
  )
}

type StatBlockProps = {
  label: string
  value: string
}

function StatBlock({ label, value }: StatBlockProps): JSX.Element {
  return (
    <div className="space-y-1 px-3 py-2 text-center">
      <p className="text-muted-foreground text-[0.55rem] uppercase tracking-[0.28em]">
        {label}
      </p>
      <p className="text-lg leading-none font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  )
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
