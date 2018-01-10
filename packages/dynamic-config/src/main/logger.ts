import * as debug from 'debug'

export const log = debug('dynamic-config:info')
log.log = console.log.bind(console)

export const warn = debug('dynamic-config:warn')
warn.log = console.warn.bind(console)

export const error = debug('dynamic-config:error')

debug.enable('dynamic-config:info')
debug.enable('dynamic-config:warn')
debug.enable('dynamic-config:error')
