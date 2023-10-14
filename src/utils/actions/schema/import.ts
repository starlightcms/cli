import { SchemaActionRunner } from './index'
import { ImportAction } from '../../../types/schema'
import { getJsonFromFile } from '../../fs'
import { ContentFile } from '../../../types/content'
import { ContentImporterMap, contentImporters } from './importers'
import { ContentBag } from '../../parameters'
import { ux } from '@oclif/core'
import path from 'node:path'

// `import` is not a valid variable name in JS, but `importAction` is.
export const importAction: SchemaActionRunner<ImportAction> = async (
  action,
  rootFolder,
  parameters,
): Promise<void> => {
  const [contentFile, contentFilePath] = await getJsonFromFile<ContentFile>(
    rootFolder,
    action.file,
  )
  ux.action.start(
    `Content migration: creating ${contentFile.content.length} object${
      contentFile.content.length === 1 ? '' : 's'
    }`,
  )

  const contentBag: ContentBag = new Map([
    ['entry', new Map()],
    ['singleton', new Map()],
    ['media', new Map()],
  ])

  for (const contentDescriptor of contentFile.content) {
    /* eslint-disable no-await-in-loop --
     * It's okay to disable this rule here. The content array order needs
     * to be respected, so we can't run importers in parallel.
     */
    const content = await contentImporters[
      contentDescriptor.type as keyof ContentImporterMap
    ](contentDescriptor, parameters, contentBag, path.dirname(contentFilePath))

    if (content) {
      contentBag.get(content.type)!.set(content.slug, content.metadata)
    }
  }

  ux.action.stop('finished')
}
