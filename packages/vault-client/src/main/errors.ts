import * as url from 'url'

export class HVInvalidResponse extends Error {
    constructor(key: string) {
        super(`Data returned from Vault for key (${key}) has incorrect structure`)
    }
}

export class HVMissingResource extends Error {
    constructor(location: string | url.Url) {
        super(`Unable to locate vault resource[${location}]`)
    }
}

export class HVFail extends Error {
    constructor(message?: string) {
        super(message)
    }
}
