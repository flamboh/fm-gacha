import { useEffect, useState } from 'react'
import type { FormEvent, JSX } from 'react'
import { SignUp, useAuth } from '@clerk/tanstack-react-start'
import { CircleNotchIcon } from '@phosphor-icons/react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage(): JSX.Element {
  const { isLoaded, userId } = useAuth()
  const ensureViewer = useMutation(api.users.ensureViewer)
  const setLastFmUsername = useMutation(api.users.setLastFmUsername)
  const viewer = useQuery(api.users.getViewer, userId ? {} : 'skip')
  const [lastFmUsername, setLastFmUsernameValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      return
    }

    void ensureViewer({})
  }, [ensureViewer, userId])

  useEffect(() => {
    if (viewer === undefined) {
      return
    }

    setLastFmUsernameValue(viewer?.lastFmUsername ?? '')
  }, [viewer])

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

  if (viewer === undefined) {
    return (
      <main className="bg-background text-foreground flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-8">
        <div className="text-muted-foreground flex flex-col items-center gap-3 text-xs uppercase tracking-[0.22em]">
          <CircleNotchIcon
            aria-hidden="true"
            className="text-foreground size-8 animate-spin"
          />
          <span>Loading profile</span>
        </div>
      </main>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage(null)
    setStatusMessage(null)
    setIsSaving(true)

    try {
      const normalizedUsername = lastFmUsername.trim()

      await setLastFmUsername({
        lastFmUsername,
      })

      setStatusMessage(
        normalizedUsername
          ? 'Last.fm username saved.'
          : 'Last.fm username cleared.',
      )
      setLastFmUsernameValue(normalizedUsername)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="bg-background text-foreground min-h-[calc(100dvh-4rem)] px-6 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <section className="space-y-3">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.28em]">
            Profile
          </p>
          <h1 className="text-3xl uppercase tracking-[0.16em] text-balance">
            Last.fm
          </h1>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-[0.18em]">
              Username
            </CardTitle>
            <CardDescription>
              Save your Last.fm handle for future profile-based pulls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em]">
                <span className="text-muted-foreground">Last.fm username</span>
                <input
                  value={lastFmUsername}
                  onChange={(event) => {
                    setLastFmUsernameValue(event.target.value)
                    setErrorMessage(null)
                    setStatusMessage(null)
                  }}
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="flamboh"
                  className="border-input bg-background h-11 border px-3 text-sm tracking-normal outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                />
              </label>

              <div className="flex items-center gap-3">
                <Button type="submit" size="lg" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isSaving || lastFmUsername.length === 0}
                  onClick={() => {
                    setLastFmUsernameValue('')
                    setErrorMessage(null)
                    setStatusMessage(null)
                  }}
                >
                  Clear
                </Button>
              </div>

              {statusMessage ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {statusMessage}
                </p>
              ) : null}

              {errorMessage ? (
                <p className="text-destructive text-sm">{errorMessage}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
