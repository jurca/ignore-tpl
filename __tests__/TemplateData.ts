import TemplateData from '../TemplateData'

describe('TemplateData', () => {
    it('should store the provided key, template sources and placeholder values', () => {
        const key = {}
        const values = [{}, {}, {}]
        const templateSource: TemplateStringsArray = ['<div>', '</div><p class="', '">', '</p>'] as any
        (templateSource as any).raw = templateSource
        const templateData = new TemplateData(key, templateSource, values)

        expect(templateData.key).toBe(key)
        expect(templateData.templateSource).toEqual(templateSource)
        expect(templateData.templateSource.join('<!---->')).toBe('<div><!----></div><p class="<!---->"><!----></p>')
        expect(templateData.placeholderValues).toEqual(values)
        expect(templateData.placeholderValues[0]).toBe(values[0])
        expect(templateData.placeholderValues[1]).toBe(values[1])
        expect(templateData.placeholderValues[2]).toBe(values[2])
    })

    it('should enable creating a template from the template source', () => {
        const sources: TemplateStringsArray = [
            '<div><!-- my testing comment -->',
            '</div>',
            '<div><p class="foo" id="',
            '" title="',
            '">',
            '</p><strong>',
            '</strong></div>',
        ] as any
        (sources as any).raw = sources
        const templateData = new TemplateData(0, sources, [])
        const template = templateData.createTemplate()
        expect(template.domTemplate.childNodes.length).toBe(3)
        expect(template.dynamicFragments.length).toBe(6)
    })
})
