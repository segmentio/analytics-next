import type {
  PreInitMethodCall,
  PreInitMethodName,
  PreInitMethodParams,
} from '.'

const normalizeSnippetBuffer = (buffer: SnippetBuffer): PreInitMethodCall[] => {
  return buffer.map(
    ([methodName, ...args]) =>
      ({
        method: methodName,
        resolve: () => {},
        reject: console.error,
        args,
        called: false,
      } as PreInitMethodCall)
  )
}

type SnippetWindowBufferedMethodCall<
  MethodName extends PreInitMethodName = PreInitMethodName
> = [MethodName, ...PreInitMethodParams<MethodName>]

/**
 * A list of the method calls before initialization for snippet users
 * For example, [["track", "foo", {bar: 123}], ["page"], ["on", "ready", function(){..}]
 */
type SnippetBuffer = SnippetWindowBufferedMethodCall[]

/**
 * Fetch the buffered method calls from the window object and normalize them.
 */
export const getSnippetWindowBuffer = (): PreInitMethodCall[] => {
  const wa = window.analytics
  const buffered =
    // @ts-expect-error
    (wa && wa[0] ? [...wa] : []) as SnippetBuffer
  return normalizeSnippetBuffer(buffered)
}
