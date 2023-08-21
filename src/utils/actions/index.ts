import {
  TemplateAction,
  TemplateActionTypes,
  TemplateParameters,
} from '../../types/template'
import { copy } from './copy'
import { replace } from './replace'

export type ActionRunner<Action extends TemplateAction<TemplateActionTypes>> = (
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
}

export default runnerList
