export function objectHasProperty<Thing, PropertyName extends string>(
  thing: Thing,
  property: PropertyName
): thing is Thing & Record<PropertyName, unknown> {
  return (
    typeof thing === 'object' && property in (thing as Record<string, unknown>)
  )
}
