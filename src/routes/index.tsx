import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { SignUpButton, useAuth } from '@clerk/tanstack-react-start'
import { createFileRoute, useHydrated } from '@tanstack/react-router'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { PackCarousel } from '#/components/pack-carousel'
import type { PackCarouselCard } from '#/components/pack-carousel'
import { Button, buttonVariants } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import {
  GUEST_PACK_LIMIT,
  readGuestPackState,
  saveGuestPack,
} from '#/lib/guest-pack-storage'

function readInitialGuestPackState() {
  if (typeof window === 'undefined') {
    return { packsOpened: 0, lastPack: null }
  }
  return readGuestPackState()
}

export const Route = createFileRoute('/')({
  component: HomePage,
})

type OpenedCard = PackCarouselCard & {
  durationMs?: number
}

type OpenedPack = {
  themeTag: string
  cards: OpenedCard[]
}

type SealedCardContentProps = {
  footerLabel: string
  message: string
}

const stackTransitionMs = 180

function HomePage(): JSX.Element {
  const { isLoaded, userId } = useAuth()
  const isHydrated = useHydrated()
  const openPack = useAction(api.packs.openPack)
  const [activePack, setActivePack] = useState<OpenedPack | null>(
    () => readInitialGuestPackState().lastPack,
  )
  const [guestPackCount, setGuestPackCount] = useState<number>(
    () => readInitialGuestPackState().packsOpened,
  )
  const [savedGuestPack, setSavedGuestPack] = useState<OpenedPack | null>(
    () => readInitialGuestPackState().lastPack,
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [transitioningFromIndex, setTransitioningFromIndex] = useState<
    number | null
  >(null)
  const [isOpening, setIsOpening] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const previousSelectedIndexRef = useRef(0)

  useEffect(() => {
    if (!activePack) {
      previousSelectedIndexRef.current = 0
      return
    }

    const previousIndex = previousSelectedIndexRef.current
    if (previousIndex === selectedIndex) return

    setTransitioningFromIndex(previousIndex)
    previousSelectedIndexRef.current = selectedIndex

    const timeoutId = window.setTimeout(() => {
      setTransitioningFromIndex(null)
    }, stackTransitionMs)

    return () => window.clearTimeout(timeoutId)
  }, [activePack, selectedIndex])

  async function handleOpenPack(): Promise<void> {
    if (!isHydrated || !isLoaded || isOpening) return
    if (!userId && guestPackCount >= GUEST_PACK_LIMIT) return

    setErrorMessage(null)
    setIsOpening(true)

    try {
      const openedPack = await openPack({})

      if (!userId) {
        const nextGuestState = saveGuestPack(openedPack, guestPackCount + 1)
        setGuestPackCount(nextGuestState.packsOpened)
        setSavedGuestPack(nextGuestState.lastPack)
      }

      setActivePack(openedPack)
      setSelectedIndex(0)
      previousSelectedIndexRef.current = 0
      setTransitioningFromIndex(null)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Pack opening failed',
      )
    } finally {
      setIsOpening(false)
    }
  }

  function handleShowPrevious(): void {
    if (selectedIndex === 0) return
    setSelectedIndex(selectedIndex - 1)
  }

  function handleShowNext(): void {
    if (!activePack || selectedIndex >= activePack.cards.length - 1) return
    setSelectedIndex(selectedIndex + 1)
  }

  function handleResetPack(): void {
    setActivePack(null)
    setSelectedIndex(0)
    previousSelectedIndexRef.current = 0
    setTransitioningFromIndex(null)
  }

  const isPackReady = activePack !== null
  const isGuestOutOfPacks = !userId && guestPackCount >= GUEST_PACK_LIMIT
  const isOpenPackDisabled =
    !isHydrated || !isLoaded || isOpening || isGuestOutOfPacks
  const canShowPrevious = selectedIndex > 0
  const canShowNext =
    activePack !== null && selectedIndex < activePack.cards.length - 1

  return (
    <main className="bg-background text-foreground flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        {!isPackReady ? (
          isGuestOutOfPacks ? (
            <Card className="playing-card">
              <CardContent className="relative flex h-full min-h-0 flex-col justify-between gap-6 p-5 sm:p-6">
                <div
                  aria-hidden
                  className="absolute inset-3 rounded-[1.35rem] border border-border/60"
                />
                <SealedCardContent
                  message="guest pack used. sign up for more pulls"
                  footerLabel="join"
                />
                <div className="relative flex flex-col gap-3">
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className={buttonVariants({ size: 'lg' })}
                    >
                      Sign up to keep opening
                    </button>
                  </SignUpButton>
                  {savedGuestPack ? (
                    <Button
                      onClick={() => setActivePack(savedGuestPack)}
                      variant="outline"
                      size="lg"
                    >
                      View saved pack
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : (
            <button
              type="button"
              onClick={handleOpenPack}
              disabled={isOpenPackDisabled}
              className="w-full rounded-[1.75rem] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Card className="playing-card hover:-translate-y-1">
                <CardContent className="relative flex h-full min-h-0 flex-col justify-between p-5 sm:p-6">
                  <div
                    aria-hidden
                    className="absolute inset-3 rounded-[1.35rem] border border-border/60"
                  />
                  <SealedCardContent
                    message={
                      isOpening ? 'opening pack...' : 'click card to open'
                    }
                    footerLabel="play"
                  />
                </CardContent>
              </Card>
            </button>
          )
        ) : (
          <>
            <PackCarousel
              cards={activePack.cards}
              selectedIndex={selectedIndex}
              transitioningFromIndex={transitioningFromIndex}
              canShowNext={canShowNext}
              canShowPrevious={canShowPrevious}
              onShowNext={handleShowNext}
              onShowPrevious={handleShowPrevious}
            />

            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={handleResetPack}
                disabled={isOpening}
                size="lg"
                className="w-full"
              >
                {isOpening ? 'opening pack...' : 'back to pack'}
              </Button>
            </div>
          </>
        )}

        {errorMessage ? (
          <p className="text-destructive text-center text-sm">{errorMessage}</p>
        ) : null}
      </div>
    </main>
  )
}

function SealedCardContent({
  footerLabel,
  message,
}: SealedCardContentProps): JSX.Element {
  return (
    <>
      <div className="relative flex items-start justify-between text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
        <span>fm</span>
        <span>pack</span>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm uppercase tracking-[0.28em]">sealed pack</p>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
      <div className="relative flex items-end justify-between text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
        <span>{footerLabel}</span>
        <span>fm</span>
      </div>
    </>
  )
}
