import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { createFileRoute, useHydrated } from '@tanstack/react-router'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { createOwnerKey } from '#/lib/pack-session'

export const Route = createFileRoute('/')({
  component: HomePage,
})

type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic'

type OpenedCard = {
  slot: number
  title: string
  artist: string
  artistGenres?: string[]
  album?: string
  lastFmUrl: string
  listeners: number
  playcount: number
  durationMs?: number
  sourceTag: string
  rarity: Rarity
}

type OpenedPack = {
  ownerKey: string
  openedAt: number
  themeTag: string
  cards: OpenedCard[]
}

const rarityCopy: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  mythic: 'Mythic',
}

function HomePage() {
  const { user } = useUser()
  const isHydrated = useHydrated()
  const openPack = useAction(api.packs.openPack)
  const [ownerKey, setOwnerKey] = useState<string | null>(null)
  const [activePack, setActivePack] = useState<OpenedPack | null>(null)
  const [revealedCount, setRevealedCount] = useState(0)
  const [isOpening, setIsOpening] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    setOwnerKey(createOwnerKey(user?.id))
  }, [isHydrated, user?.id])

  const handleOpenPack = async () => {
    if (!ownerKey || isOpening) {
      return
    }

    setErrorMessage(null)
    setIsOpening(true)

    try {
      const openedPack = await openPack({ ownerKey })
      setActivePack(openedPack)
      setRevealedCount(0)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Pack opening failed',
      )
    } finally {
      setIsOpening(false)
    }
  }

  const handleAdvance = () => {
    if (!activePack || revealedCount >= activePack.cards.length) {
      return
    }

    setRevealedCount((count) => count + 1)
  }

  const currentCard =
    activePack && revealedCount > 0 ? activePack.cards[revealedCount - 1] : null
  const cardsRemaining = activePack
    ? activePack.cards.length - revealedCount
    : 0
  const isPackReady = activePack !== null
  const isComplete =
    activePack !== null && revealedCount === activePack.cards.length
  const isOpenPackDisabled = !isHydrated || !ownerKey || isOpening

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        {!isPackReady ? (
          <Button
            onClick={handleOpenPack}
            disabled={isOpenPackDisabled}
            size="lg"
            className="h-14 w-full"
          >
            {isOpening ? 'opening pack...' : 'open pack'}
          </Button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleAdvance}
              disabled={isComplete}
              className="w-full"
            >
              <Card className="bg-card text-card-foreground w-full cursor-pointer py-0 text-left shadow-none">
                <CardContent className="flex min-h-96 flex-col justify-between p-6">
                  {currentCard ? (
                    <>
                      <div className="space-y-3">
                        <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
                          {rarityCopy[currentCard.rarity]}
                        </p>
                        <p className="text-3xl font-semibold tracking-tight">
                          {currentCard.title}
                        </p>
                        <p className="text-muted-foreground text-sm uppercase tracking-[0.18em]">
                          {currentCard.artist}
                        </p>
                        {currentCard.album ? (
                          <p className="text-muted-foreground text-sm">
                            {currentCard.album}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2 text-sm">
                        <p>{formatCount(currentCard.listeners)} listeners</p>
                        <p>{formatCount(currentCard.playcount)} plays</p>
                        {currentCard.artistGenres?.length ? (
                          <p className="text-muted-foreground">
                            {formatGenres(currentCard.artistGenres)}
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <p className="text-sm uppercase tracking-[0.24em]">
                        sealed pack
                      </p>
                      <p className="text-muted-foreground text-sm">
                        click to reveal card 1
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </button>

            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={isComplete ? handleOpenPack : handleAdvance}
                disabled={isOpening}
                size="lg"
                className="w-full"
              >
                {isOpening
                  ? 'opening pack...'
                  : isComplete
                    ? 'open another pack'
                    : `reveal next card (${cardsRemaining} left)`}
              </Button>

              {errorMessage ? (
                <p className="text-destructive text-center text-sm">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function formatCount(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatGenres(genres: string[]) {
  return genres.slice(0, 3).join(' · ')
}
