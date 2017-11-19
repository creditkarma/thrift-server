export class InputBufferUnderrunError extends Error {
  public readonly name: string = 'InputBufferUnderrunError'

  constructor(message?: string) {
    super(message)
  }
}
