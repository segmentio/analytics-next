import { ClickSignalsGenerator, FormSubmitGenerator } from './dom-gen'
import {
  MutationChangeGenerator,
  OnChangeGenerator,
  ContentEditableChangeGenerator,
} from './change-gen'
import { SignalGeneratorClass } from '../types'
import { OnNavigationEventGenerator } from './navigation-gen'

export const domGenerators: SignalGeneratorClass[] = [
  MutationChangeGenerator,
  OnChangeGenerator,
  ContentEditableChangeGenerator,
  ClickSignalsGenerator,
  FormSubmitGenerator,
  OnNavigationEventGenerator,
]
