import fs from 'node:fs/promises'
import path from 'node:path'

export const getDotStarlightPath = (templateRootPath?: string): string => {
  return path.join(
    path.resolve(templateRootPath ?? process.cwd()),
    '.starlight',
  )
}

export const getJsonFromFile = async <ContentType = unknown>(
  basePath: string,
  filePath: string,
): Promise<[ContentType, string]> => {
  const resolvedPath = path.resolve(basePath, filePath)

  return [JSON.parse(await fs.readFile(resolvedPath, 'utf8')), resolvedPath]
}
