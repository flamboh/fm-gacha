const GUEST_SESSION_STORAGE_KEY = 'fm-gacha.guest-session-id'

export const createOwnerKey = (userId: string | null | undefined) => {
  if (userId) {
    return `user:${userId}`
  }

  const existing = window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY)
  if (existing) {
    return `guest:${existing}`
  }

  const guestSessionId = crypto.randomUUID()
  window.localStorage.setItem(GUEST_SESSION_STORAGE_KEY, guestSessionId)
  return `guest:${guestSessionId}`
}
