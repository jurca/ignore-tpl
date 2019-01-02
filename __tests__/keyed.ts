import keyed from '../keyed'
import TemplateData from '../TemplateData'

describe('keyed', () => {
    it('should reject an undefined key', () => {
        expect(() => {
            keyed(undefined)
        }).toThrowError(TypeError)
    })

    it('should return a template factory', () => {
        const tpl = keyed(null)
        expect(typeof tpl).toBe('function')
        expect(tpl.length).toBe(1)
    })

    it('should pass the key to the resulting template', () => {
        const key = {}
        const random = Math.random()
        const template = keyed(key)`foo${random}bar`
        expect(template).toBeInstanceOf(TemplateData)
        expect(template.key).toBe(key)
        expect(template.templateSource).toEqual(['foo', 'bar'])
        expect(template.placeholderValues).toEqual([random])
    })
})
