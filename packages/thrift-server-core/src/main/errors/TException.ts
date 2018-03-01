export class TException implements Error {
    public readonly name: string = 'TException'
    public message: string

    constructor(message: string = '') {
        this.message = message
    }
}
