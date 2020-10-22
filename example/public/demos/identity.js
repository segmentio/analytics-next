const identityStiching = () => {
  let user

  const identity = {
    name: 'Identity Stitching',
    type: 'enrichment',
    version: '0.1.0',

    load: async (_ctx, ajs) => {
      user = ajs.user()
    },

    isLoaded: () => user !== undefined,

    async identify(ctx) {
      const req = await fetch(`https://jsonplaceholder.typicode.com/users/${ctx.event.userId}`)
      const userReq = await req.json()

      ctx.updateEvent('traits.custom', userReq)
      user.traits(userReq)

      return ctx
    },
  }

  return identity
}

await window.analytics.register(identifier())
