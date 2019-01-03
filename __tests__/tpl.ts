import tpl from '../tpl'

describe('tpl', () => {
    it('should return a TemplateData instance with the provided template sources and placeholder values', () => {
        const value1 = Math.random()
        const value2 = {}
        const template = tpl`foo<p>${value1}</p><div>${value2}</div>`
        expect(template.templateSource).toEqual(['foo<p>', '</p><div>', '</div>'])
    })

    it('should return a TemplateData instance with the key set to undefined', () => {
        const template = tpl`foo<div>bar${1}</div>`
        expect(template.key).toBeUndefined()
    })
})
