import Calculator = require('./fixtures/Calculator')

const handlers = {
  // TODO: promise
  ping: function ping(cb) {
    console.log('ping()')
    cb(null)
  },
}

import bodyParser = require('body-parser')
import express = require('express')
import { thriftExpress } from './'

const PORT = 3000

const app = express()

// TODO: shouldn't need to pass .Processor
app.use('/', bodyParser.raw(), thriftExpress(Calculator.Processor, handlers, { protocol: 'json' }))

app.listen(PORT)
