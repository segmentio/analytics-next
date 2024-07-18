import {
  resolveAliasArguments,
  resolveArguments,
  resolvePageArguments,
  resolveUserArguments,
} from '@segment/analytics-next'

export const resolvers = {
  resolveAliasArguments,
  resolveArguments,
  resolvePageArguments,
  resolveUserArguments: resolveUserArguments({
    id: () => undefined,
  }),
}
