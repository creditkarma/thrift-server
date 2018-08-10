import { normalizeHeaders } from '@creditkarma/thrift-server-core'

import * as Hapi from 'hapi'

const pkg: any = require('../../../package.json')

export function ApplyLinkerDZipkinServerFilter(): Hapi.PluginRegistrationObject<never> {
    const hapiZipkinPlugin: Hapi.PluginRegistrationObject<never> = {
        register(server: Hapi.Server, nothing: never, next: (err?: Error) => void) {
            server.ext('onRequest', (request, reply) => {
                request.headers = normalizeHeaders(request.headers)

                return reply.continue()
            })

            next()
        },
    }

    hapiZipkinPlugin.register.attributes = {
        name: 'hapi-linkerd-filter',
        version: pkg.version,
    }

    return hapiZipkinPlugin
}
