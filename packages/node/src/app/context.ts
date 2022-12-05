import { CoreContext } from '@segment/analytics-core'

// create a derived class since we may want to add node specific things to Context later
// we do not want to export "Xo"
export class Context extends CoreContext {}
