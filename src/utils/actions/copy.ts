import { CopyAction } from '../../types/template'
import fs from 'node:fs/promises'
import path from 'node:path'
import { ActionRunner } from './index'
import { replaceParameters } from '../template'

export const copy: ActionRunner<CopyAction> = async (
  action,
  rootFolder,
  parameters,
): Promise<void> => {
  const from = path.join(rootFolder, action.file)
  const to = path.join(rootFolder, action.to)

  await fs.copyFile(from, to)

  if (action.replace && Object.keys(action.replace).length > 0) {
    let fileContent = await fs.readFile(to, 'utf8')

    for (const key of Object.keys(action.replace)) {
      fileContent = fileContent.replaceAll(
        key,
        replaceParameters(action.replace[key], parameters),
      )
    }

    await fs.writeFile(to, fileContent, 'utf8')
  }
}
