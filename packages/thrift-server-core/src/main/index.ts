import {
    IProtocolConstructor,
    IThriftProcessor,
    ITransportConstructor,
} from './types'

export * from './types'
export * from './protocols'
export * from './transports'
export * from './observability'
export * from './errors'
export * from './utils'

export function process<Context>(args: {
    processor: IThriftProcessor<Context>,
    buffer: Buffer,
    Transport: ITransportConstructor,
    Protocol: IProtocolConstructor,
    context: Context,
}): Promise<Buffer> {
    const transportWithData = args.Transport.receiver(args.buffer)
    const input = new args.Protocol(transportWithData)

    return new Promise((resolve, reject): void => {
        const output = new args.Protocol(new args.Transport())
        args.processor.process(input, output, args.context).then((result: Buffer) => {
            resolve(result)
        }, (err: any) => {
            reject(err)
        })
    })
}
