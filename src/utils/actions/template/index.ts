import {
  TemplateAction,
  TemplateActionTypes,
  TemplateParameters,
} from '../../../types/template'
import { copy } from './copy'
import { migrate } from './migrate'
import { replace } from './replace'

export type ActionRunner<Action extends TemplateAction> = (
  action: Action,
  rootFolder: string,
  parameters: TemplateParameters,
) => Promise<void>

type ActionRunnerList = {
  [Action in TemplateActionTypes]: ActionRunner<any>
}

const runnerList: ActionRunnerList = {
  copy,
  replace,
  migrate,
}

export default runnerList
