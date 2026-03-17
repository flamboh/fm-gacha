const GUEST_SESSION_STORAGE_KEY = 'fm-gacha.guest-session-id'

export const getGuestSessionId = () => {
  const existing = window.localStorage.getItem(GUEST_SESSION_STORAGE_KEY)
  if (existing) {
    return existing
  }

  const guestSessionId = crypto.randomUUID()
  window.localStorage.setItem(GUEST_SESSION_STORAGE_KEY, guestSessionId)
  return guestSessionId
}
