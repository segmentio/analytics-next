import { Request, Response } from 'express'
import { BadRequest } from 'http-errors'

export default function postExample(req: Request, res: Response): void {
  const body = req.body
  const name: string = body.name

  if (typeof name !== 'string') {
    throw new BadRequest('Missing name')
  }

  res.json({ name })
}
