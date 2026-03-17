import { internalMutation } from './_generated/server'
import { packValidator } from './packModel'

export const storeOpenedPack = internalMutation({
  args: packValidator,
  returns: packValidator,
  handler: async (ctx, args) => {
    await ctx.db.insert('packOpens', args)
    return args
  },
})
