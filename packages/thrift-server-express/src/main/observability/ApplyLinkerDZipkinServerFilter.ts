import { normalizeHeaders } from '@creditkarma/thrift-server-core'
import * as express from 'express'

export function ApplyLinkerDZipkinServerFilter(): express.RequestHandler {
    return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
        req.headers = normalizeHeaders(req.headers)
        next()
    }
}
