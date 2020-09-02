import path from 'path'
import { promises as fs } from 'fs'
import { Request, Response } from 'express'
import knobs from '../lib/knobs'
import asyncWrapper from '../lib/async-wrapper'

async function getExample(_req: Request, res: Response): Promise<void> {
  const showServiceName = knobs.getSync('show-service-name', 1)

  if (showServiceName === 1) {
    const packageJson = await fs.readFile(path.resolve(__dirname, '../../package.json'), { encoding: 'utf8' })
    const pkg = JSON.parse(packageJson)
    res.json({ result: `Hello world - ${pkg.name}` })
  } else {
    res.json({ result: 'Hello world' })
  }
}

export default asyncWrapper(getExample)
