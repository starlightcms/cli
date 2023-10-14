import { MigrateAction } from '../../../types/template'
import { TemplateActionRunner } from './index'
import { getJsonFromFile } from '../../fs'
import { runSchemaActions } from '../schema'
import { SchemaFile } from '../../../types/schema'
import path from 'node:path'

export const migrate: TemplateActionRunner<MigrateAction> = async (
  action,
  rootFolder,
  parameters,
  command,
): Promise<void> => {
  const [schemaFile, schemaFilePath] = await getJsonFromFile<SchemaFile>(
    rootFolder,
    action.file,
  )

  await runSchemaActions(
    schemaFile,
    path.dirname(schemaFilePath),
    parameters,
    command,
  )
}
