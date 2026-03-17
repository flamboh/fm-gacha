import { defineSchema, defineTable } from 'convex/server'
import { packFields } from './packModel'

export default defineSchema({
  packOpens: defineTable(packFields).index('by_owner_opened_at', [
    'ownerKey',
    'openedAt',
  ]),
})
