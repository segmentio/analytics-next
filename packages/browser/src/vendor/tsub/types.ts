export interface Rule {
  scope: string
  target_type: string
  matchers: Matcher[]
  transformers: Transformer[][]
  destinationName?: string
}
export interface Matcher {
  type: string
  ir: string
}
export interface Transformer {
  type: string
  config?: any
}
export interface Store {
  new (rules?: Rule[]): this
  getRulesByDestinationName(destinationName: string): Rule[]
}
