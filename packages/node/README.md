# TODO: API Documentation is out of date

https://segment.com/docs/connections/sources/catalog/libraries/server/node/


NOTE:  @segment/analytics-node is unstable! do not use.


```ts
// TODO: finalize API
import { load } from '@segment/analytics-node'


// some file
export const ajsPromise = load({ writeKey: 'abc123' }).then(([ajs]) => ajs)

// some other file
import { ajsPromise } from '../analytics'

router.post('/user',  async (req, res) => {
  ajsPromise.then((ajs) => ajs.track(user.id, "some event"))
  res.json(user)
})


```
