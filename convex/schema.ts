import { defineSchema, defineTable } from 'convex/server'
import {
  discoveredSongFields,
  userCollectionEntryFields,
} from './collectionModel'
import { userFields } from './userModel'

export default defineSchema({
  users: defineTable(userFields).index('by_clerk_id', ['clerkId']),
  discoveredSongs: defineTable(discoveredSongFields).index('by_song_key', [
    'songKey',
  ]),
  userCollectionEntries: defineTable(userCollectionEntryFields)
    .index('by_user_and_song_id', ['userId', 'songId'])
    .index('by_user_and_last_collected_at', [
      'userId',
      'lastCollectedAt',
      'songId',
    ])
    .index('by_user_and_artist_sort', ['userId', 'artistSort', 'songId'])
    .index('by_user_and_title_sort', ['userId', 'titleSort', 'songId'])
    .index('by_user_and_rarity_rank', ['userId', 'rarityRank', 'songId']),
})
