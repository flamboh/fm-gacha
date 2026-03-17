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
  const importedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !userId) {
      importedUserIdRef.current = null
      return
    }

    if (importedUserIdRef.current === userId) {
      return
    }

    const guestPackState = readGuestPackState()
    if (!guestPackState.lastPack) {
      return
    }

    importedUserIdRef.current = userId

    void importGuestPack({
      pack: guestPackState.lastPack,
    })
      .then(() => {
        clearGuestPackState()
      })
      .catch((error) => {
        importedUserIdRef.current = null
        console.error('Guest pack import failed', error)
      })
  }, [importGuestPack, isLoaded, userId])

  return null
}
