import { TemplateParameters } from '../../../types/template'
import {
  SchemaAction,
  SchemaActionTypes,
  SchemaFile,
} from '../../../types/schema'
import { create } from './create'
import { importAction } from './import'
import { BaseCommand } from '../../../BaseCommand'

export type SchemaActionRunner<Action extends SchemaAction> = (
  action: Action,
  rootFolder: string,
  parameters: TemplateParameters,
  command: BaseCommand,
) => Promise<void>

type SchemaActionRunnerMap = {
  [Action in SchemaActionTypes]: SchemaActionRunner<any>
}

const actionRunners: SchemaActionRunnerMap = {
  create: create,
  import: importAction,
}

export const runSchemaActions = async (
  schemaFile: SchemaFile,
  rootFolder: string,
  parameters: TemplateParameters,
  command: BaseCommand,
): Promise<void> => {
  if (schemaFile.actions && schemaFile.actions.length > 0) {
    for (const action of schemaFile.actions) {
      if (Object.prototype.hasOwnProperty.call(actionRunners, action.type)) {
        /* eslint-disable no-await-in-loop --
         * It's okay to disable this rule here. The action array order needs
         * to be respected, so we can't run actions in parallel.
         */
        await actionRunners[action.type as SchemaActionTypes](
          action,
          rootFolder,
          parameters,
          command,
        )
      }
    }
  }
}
