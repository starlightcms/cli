import path from 'node:path'
import { MigrateAction, TemplateFile } from '../types/template'
import { templateFileSchema } from '../schemas/template'
import { schemaFileSchema } from '../schemas/schema'
import { ImportAction, SchemaFile } from '../types/schema'
import { contentFileSchema } from '../schemas/content'
import { ValidationError } from 'yup'
import { getJsonFromFile } from './fs'

export class TemplateValidationError extends Error {
  public file: string
  public validationError: ValidationError

  constructor(file: string, validationError: ValidationError) {
    super()
    this.file = file
    this.validationError = validationError
  }
}

export const validateTemplateMetadata = async (
  dotStarlightPath: string,
): Promise<TemplateFile> => {
  const [templateFileJson] = await getJsonFromFile(
    dotStarlightPath,
    'template.json',
  )
  let templateFile: TemplateFile

  try {
    templateFile = await templateFileSchema.validate(templateFileJson, {
      strict: true,
      abortEarly: false,
      stripUnknown: true,
      context: {
        basePath: dotStarlightPath,
      },
    })
  } catch (error) {
    throw error instanceof ValidationError
      ? new TemplateValidationError(
          `template metadata (${path.resolve(
            dotStarlightPath,
            'template.json',
          )})`,
          error,
        )
      : error
  }

  // Validate migrations
  const migrateAction = templateFile.actions?.find(
    (action): action is MigrateAction => action.type === 'migrate',
  )

  if (migrateAction) {
    const [schemaFileJson, schemaFilePath] = await getJsonFromFile(
      dotStarlightPath,
      migrateAction.file,
    )
    let schemaFile: SchemaFile

    try {
      schemaFile = await schemaFileSchema.validate(schemaFileJson, {
        strict: true,
        abortEarly: false,
        stripUnknown: true,
        context: {
          // basePath is relative to the schema file, not the template file.
          schemaPath: schemaFilePath,
        },
      })
    } catch (error) {
      throw error instanceof ValidationError
        ? new TemplateValidationError(
            `template schema (${schemaFilePath})`,
            error,
          )
        : error
    }

    // Validate content files
    const importActions = schemaFile.actions.filter(
      (action): action is ImportAction => action.type === 'import',
    )

    for (const importAction of importActions) {
      /* eslint-disable no-await-in-loop --
       * This is a valid use of await inside a loop because we want the order
       * in which content files are validated to be the same between runs. If
       * we don't do this, users might get confused with different validation
       * errors if they run a few validations in a row using files with
       * multiple errors.
       */
      const [contentFileJson, contentFilePath] = await getJsonFromFile(
        path.dirname(schemaFilePath),
        importAction.file,
      )

      try {
        /* eslint-disable no-await-in-loop --
         * Just as before, we want the validation order to be stable.
         */
        await contentFileSchema.validate(contentFileJson, {
          strict: true,
          abortEarly: false,
          stripUnknown: true,
          context: {
            // basePath is relative to the content file.
            basePath: path.dirname(contentFilePath),
          },
        })
      } catch (error) {
        throw error instanceof ValidationError
          ? new TemplateValidationError(
              `template content (${contentFilePath})`,
              error,
            )
          : error
      }
    }
  }

  return templateFile
}
