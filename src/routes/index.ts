import express from 'express'
import getExample from './get-example'
import postExample from './post-example'

const router = express.Router()
export default router

router.get('/', getExample)
router.post('/', postExample)
