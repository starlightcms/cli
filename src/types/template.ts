export type TemplateParameters = {
  project: {
    name: string
  }
  organization: {
    id: number
    title: string
    slug: string
  }
  workspace: {
    id: number
    title: string
    slug: string
  }
}

export type TemplateParameterMap = {
  [Key in keyof TemplateParameters]: (keyof TemplateParameters[Key])[]
}

export type ReplaceMap = {
  [searchValue: string]: string
}

export interface TemplateAction {
  type: string
}

export interface ReplaceAction extends TemplateAction {
  type: 'replace'
  target: string
  replace: ReplaceMap
}

export interface CopyAction extends TemplateAction {
  type: 'copy'
  file: string
  to: string
  replace?: ReplaceMap
}

export interface MigrateAction extends TemplateAction {
  type: 'migrate'
  file: string
}

export type TemplateActionMap = {
  copy: CopyAction
  replace: ReplaceAction
  migrate: MigrateAction
}

export type TemplateActionTypes = keyof TemplateActionMap

export type TemplateFile = {
  version: number
  name: string
  description?: string
  author?: string
  url?: string
  preview?: string
  instructions?: string
  actions?: TemplateAction[]
}

export type TemplateFileValidationContext = {
  basePath: string
}
