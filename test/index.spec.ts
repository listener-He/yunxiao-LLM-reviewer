import {expect} from 'chai'
import {convertToUpperCase} from '../src/util'

describe('convertToUpperCase test', () => {
    it('should return upper string', () => {
        expect(convertToUpperCase('hello world')).equal('HELLO WORLD')
    })
})
