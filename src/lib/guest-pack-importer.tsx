'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/tanstack-react-start'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  clearGuestPackState,
  readGuestPackState,
} from '#/lib/guest-pack-storage'

export function GuestPackImporter() {
  const { isLoaded, userId } = useAuth()
  const importGuestPack = useMutation(api.users.importGuestPack)
  const ensureViewer = useMutation(api.users.ensureViewer)
  const handledUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !userId) {
      handledUserIdRef.current = null
      return
    }

    if (handledUserIdRef.current === userId) {
      return
    }

    handledUserIdRef.current = userId

    void ensureViewer({}).catch((error) => {
      console.error('ensureViewer failed', error)
    })

    const guestPackState = readGuestPackState()
    if (!guestPackState.lastPack) {
      return
    }

    void importGuestPack({
      pack: guestPackState.lastPack,
    })
      .then(() => {
        clearGuestPackState()
      })
      .catch((error) => {
        handledUserIdRef.current = null
        console.error('Guest pack import failed', error)
      })
  }, [ensureViewer, importGuestPack, isLoaded, userId])

  return null
}
