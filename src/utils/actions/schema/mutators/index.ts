import { TemplateParameters } from '../../../../types/template'

export interface SchemaMutator<Data> {
  create: (data: Data, parameters: TemplateParameters) => Promise<void>
}
