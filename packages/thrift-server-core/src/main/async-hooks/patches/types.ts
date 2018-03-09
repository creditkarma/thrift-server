import { Hooks } from '../Hooks'
import { State } from '../State'

export type Patch = (hooks: Hooks, state: State) => void
