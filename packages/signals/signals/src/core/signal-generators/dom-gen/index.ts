import {
  ClickSignalsGenerator,
  FormSubmitGenerator,
  OnNavigationEventGenerator,
} from './dom-gen'
import {
  MutationChangeGenerator,
  OnChangeGenerator,
  ContentEditableChangeGenerator,
} from './change-gen'
import { SignalGeneratorClass } from '../types'

export const domGenerators: SignalGeneratorClass[] = [
  MutationChangeGenerator,
  OnChangeGenerator,
  ContentEditableChangeGenerator,
  ClickSignalsGenerator,
  FormSubmitGenerator,
  OnNavigationEventGenerator,
]
