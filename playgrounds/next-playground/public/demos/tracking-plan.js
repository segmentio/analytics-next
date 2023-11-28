function tp(id, token) {
  let plan = undefined

  const trackingPlan = {
    name: 'Tracking Plan',
    version: '0.1.0',
    type: 'before',

    isLoaded() {
      return plan !== undefined
    },

    async load() {
      const req = await fetch(
        `https://api.segmentapis.com/tracking-plans/${id}/rules\?pagination.count\=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const result = await req.json()
      plan = result?.data?.rules ?? []
    },

    async track(ctx) {
      const evt = ctx.event.event
      const rule = plan.find(
        (rule) => rule.type === 'TRACK' && rule.key === evt
      )

      if (rule) {
        const validation = await fetch('https://assertible.com/json', {
          body: JSON.stringify({ json: ctx.event, schema: rule.jsonSchema }),
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
        })

        const response = await validation.json()
        if (response.errors.length) {
          console.table(response.errors)
          throw new Error(response.errors.join('\n'))
        }
      }

      return ctx
    },
  }

  return trackingPlan
}

const token = ''
const id = ''

const xt = tp(id, token)

await window.analytics.register(xt)
await window.analytics.track('Control')
