import {
  TemplateAction,
  TemplateActionTypes,
  TemplateFile,
  TemplateParameters,
} from '../../../types/template'
import { copy } from './copy'
import { migrate } from './migrate'
import { replace } from './replace'
import { BaseCommand } from '../../../BaseCommand'

export type TemplateActionRunner<Action extends TemplateAction> = (
  action: Action,
  rootFolder: string,
  parameters: TemplateParameters,
  command: BaseCommand,
) => Promise<void>

type TemplateActionRunnerMap = {
  [Action in TemplateActionTypes]: TemplateActionRunner<any>
}

const actionRunners: TemplateActionRunnerMap = {
  copy,
  replace,
  migrate,
}

export const runTemplateActions = async (
  templateMetadata: TemplateFile,
  rootFolder: string,
  parameters: TemplateParameters,
  command: BaseCommand,
  ignoreMigrations = false,
  // eslint-disable-next-line max-params
): Promise<void> => {
  if (templateMetadata.actions && templateMetadata.actions.length > 0) {
    for (const action of templateMetadata.actions) {
      if (ignoreMigrations && action.type === 'migrate') continue

      if (Object.prototype.hasOwnProperty.call(actionRunners, action.type)) {
        /* eslint-disable no-await-in-loop --
         * It's okay to disable this rule here. The action array order needs
         * to be respected, so we can't run actions in parallel.
         */
        await actionRunners[action.type as TemplateActionTypes](
          action,
          rootFolder,
          parameters,
          command,
        )
      }
    }
  }
}
