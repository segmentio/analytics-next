import { JSONRequests } from './types'
import fs from 'fs-extra'
import path from 'path'

const PATH = path.join(process.cwd(), 'e2e-tests/data/requests/')

const getFileContent = (file: string): JSONRequests => {
  const filePath = path.join(PATH, file)
  const jsonString = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(jsonString)
}

export default getFileContent
