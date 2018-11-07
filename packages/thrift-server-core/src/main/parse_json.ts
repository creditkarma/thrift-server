/**
 * This implementation is largely taken from the Apache project and reimplemented in TypeScript.
 *
 * The orginal project can be found here:
 * https://raw.githubusercontent.com/apache/thrift/master/lib/nodejs/lib/thrift/json_parse.js
 */

import { Int64 } from './Int64'

type JsonValue = {} | Array<any> | string | number | boolean | null | undefined

class JsonParser {
    private at = 0
    private ch = ''
    private escapee: Record<string, string> = {
        '"': '"',
        '\\': '\\',
        '/': '/',
        b: '\b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
    }
    private text = ''

    constructor(source: string) {
        this.text = source
        this.at = 0
        this.ch = ' '
    }

    public parse(): any {
        const result = this.value()
        this.white()
        if (this.getCh()) {
            throw new SyntaxError('Syntax error')
        }

        return result
    }

    private array() {
        // Parse an array value.
        const array: Array<any> = []

        if (this.getCh() === '[') {
            this.next('[')
            this.white()
            if (this.getCh() === ']') {
                this.next(']')
                return array // empty array
            }
            while (this.getCh()) {
                array.push(this.value())
                this.white()
                if (this.getCh() === ']') {
                    this.next(']')
                    return array
                }
                this.next(',')
                this.white()
            }
        }
        throw new SyntaxError('Bad array')
    }

    private object() {
        // Parse an object value.

        let key: string | undefined = ''
        const object: Record<string, JsonValue> = {}

        if (this.getCh() === '{') {
            this.next('{')
            this.white()
            if (this.getCh() === '}') {
                this.next('}')
                return object // empty object
            }
            while (this.getCh()) {
                key = this.string()
                this.white()
                this.next(':')
                if (Object.hasOwnProperty.call(object, key)) {
                    throw new SyntaxError('Duplicate key "' + key + '"')
                }
                object[key] = this.value()
                this.white()
                if (this.getCh() === '}') {
                    this.next('}')
                    return object
                }
                this.next(',')
                this.white()
            }
        }
        throw new SyntaxError('Bad object')
    }

    private value(): JsonValue {
        // Parse a JSON value. It could be an object, an array, a string, a number,
        // or a word.

        this.white()
        switch (this.getCh()) {
            case '{':
                return this.object()
            case '[':
                return this.array()
            case '"':
                return this.string()
            case '-':
                return this.number()
            default:
                return this.isNumber() ? this.number() : this.word()
        }
    }

    private isNumber() {
        const char = this.getCh()
        if (char >= '0' && char <= '9') {
            return true
        }

        if (char !== '.') {
            return false
        }

        const nextChar = this.peekNext()
        if (!nextChar) {
            return false
        }

        return nextChar >= '0' && nextChar <= '9'
    }

    private peekNext() {
        return this.text.charAt(this.at)
    }

    private next(c?: string) {
        // If a c parameter is provided, verify that it matches the current character.
        if (c && c !== this.getCh()) {
            throw new SyntaxError(
                "Expected '" + c + "' instead of '" + this.getCh() + "'",
            )
        }

        // Get the next character. When there are no more characters,
        // return the empty string.

        this.ch = this.text.charAt(this.at)
        this.at += 1
        return this.ch
    }

    private getCh() {
        return this.ch
    }

    private number() {
        // Parse a number value.
        let number = 0
        let string = ''

        if (this.getCh() === '-') {
            string = '-'
            this.next('-')
        }
        while (this.getCh() >= '0' && this.getCh() <= '9') {
            string += this.getCh()
            this.next()
        }
        if (this.getCh() === '.') {
            string += '.'
            while (this.next() && this.getCh() >= '0' && this.getCh() <= '9') {
                string += this.getCh()
            }
        }
        if (this.getCh() === 'e' || this.getCh() === 'E') {
            string += this.getCh()
            this.next()
            if (this.getCh() === '-' || this.getCh() === '+') {
                string += this.getCh()
                this.next()
            }
            while (this.getCh() >= '0' && this.getCh() <= '9') {
                string += this.getCh()
                this.next()
            }
        }
        number = +string
        if (!isFinite(number)) {
            throw new SyntaxError('Bad number')
        } else if (number >= Int64.MAX_INT || number <= Int64.MIN_INT) {
            // Return raw string for further process in JSONProtocol
            return string
        } else {
            return number
        }
    }

    private string(): string {
        // Parse a string value.
        let hex = 0
        let i = 0
        let string = ''
        let uffff = 0

        // When parsing for string values, we must look for " and \ characters.
        if (this.getCh() === '"') {
            while (this.next()) {
                if (this.getCh() === '"') {
                    this.next()
                    return string
                }
                if (this.getCh() === '\\') {
                    this.next()
                    if (this.getCh() === 'u') {
                        uffff = 0
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(this.next(), 16)
                            if (!isFinite(hex)) {
                                break
                            }
                            uffff = uffff * 16 + hex
                        }
                        string += String.fromCharCode(uffff)
                    } else if (typeof this.escapee[this.getCh()] === 'string') {
                        string += this.escapee[this.getCh()]
                    } else {
                        break
                    }
                } else {
                    string += this.getCh()
                }
            }
        }
        throw new SyntaxError('Bad string')
    }

    private white() {
        // Skip whitespace.
        while (this.getCh() && this.getCh() <= ' ') {
            this.next()
        }
    }

    private word() {
        // true, false, or null.
        switch (this.getCh()) {
            case 't':
                this.next('t')
                this.next('r')
                this.next('u')
                this.next('e')
                return true
            case 'f':
                this.next('f')
                this.next('a')
                this.next('l')
                this.next('s')
                this.next('e')
                return false
            case 'n':
                this.next('n')
                this.next('u')
                this.next('l')
                this.next('l')
                return null
        }
        throw new SyntaxError("Unexpected '" + this.getCh() + "'")
    }
}

export function parseJson(source: string) {
    return new JsonParser(source).parse()
}
