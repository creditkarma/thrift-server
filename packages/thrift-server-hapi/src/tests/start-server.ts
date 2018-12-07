import {
    createServer,
} from './server'

const server = createServer()

server.start().then(() => {
    console.log(`Thrift server started on port: ${server.connections[0].info.port}`)
})
