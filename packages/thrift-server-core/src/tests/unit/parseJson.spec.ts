import { expect } from '@hapi/code'
import * as Lab from '@hapi/lab'

import { parseJson } from '../../main/parseJson'

export const lab = Lab.script()
const { describe, it } = lab

describe('parseJson', () => {
    describe('objects', () => {
        it('parse when empty', () => {
            expect(parseJson('{}')).to.equal({})
        })

        it('parse when containing strings', () => {
            expect(parseJson('{"foo": "bar"}')).to.equal({ foo: 'bar' })
        })
    })

    describe('arrays', () => {
        it('parse when empty', () => {
            expect(parseJson('[]')).to.equal([])
        })

        it('parse when containing numbers', () => {
            expect(parseJson('[1, 2,3]')).to.equal([1, 2, 3])
        })

        it('parse when containing strings', () => {
            expect(parseJson('["foo", "bar","baz"]')).to.equal([
                'foo',
                'bar',
                'baz',
            ])
        })
    })

    describe('strings', () => {
        it('parse when empty', () => {
            expect(parseJson('""')).to.equal('')
        })

        it('parse when not empty', () => {
            expect(parseJson('"foo"')).to.equal('foo')
        })
    })

    describe('numbers', () => {
        it('parse when negative', () => {
            expect(parseJson('-1')).to.equal(-1)
            expect(parseJson('-.1')).to.equal(-0.1)
        })

        it('parse when positive', () => {
            expect(parseJson('1')).to.equal(1)
            expect(parseJson('3403')).to.equal(3403)
        })

        it('parse when starting with a colon', () => {
            expect(parseJson('.1')).to.equal(0.1)
            expect(parseJson('.8304')).to.equal(0.8304)
        })
    })

    describe('booleans', () => {
        it('parse when true', () => {
            expect(parseJson('true')).to.equal(true)
        })

        it('parse when false', () => {
            expect(parseJson('false')).to.equal(false)
        })
    })

    describe('null', () => {
        it('parses', () => {
            expect(parseJson('null')).to.equal(null)
        })
    })
})
