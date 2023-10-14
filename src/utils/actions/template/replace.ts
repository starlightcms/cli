import { ReplaceAction } from '../../../types/template'
import fs from 'node:fs/promises'
import path from 'node:path'
import { TemplateActionRunner } from './index'

import { replaceParameters } from '../../parameters'

export const replace: TemplateActionRunner<ReplaceAction> = async (
  action,
  rootFolder,
  parameters,
): Promise<void> => {
  const file = path.join(rootFolder, action.target)

  let fileContent = await fs.readFile(file, 'utf8')

  for (const key of Object.keys(action.replace)) {
    fileContent = fileContent.replaceAll(
      key,
      replaceParameters(action.replace[key], parameters),
    )
  }

  await fs.writeFile(file, fileContent, 'utf8')
}
