import AttributeFragment from '../fragment/AttributeFragment'
import NodeFragment from '../fragment/NodeFragment'
import PropertyFragment from '../fragment/PropertyFragment'
import Template from '../Template'

describe('Template', () => {
    it('should correctly parse the template source and find placeholders', () => {
        const sources: TemplateStringsArray = [
            '<div><!-- my testing comment -->',
            '</div>',
            '<div><p class="foo" id="',
            '" title="',
            '">',
            '</p><button .disabled="',
            '">',
            '</button></div>',
        ] as any
        (sources as any).raw = sources
        const template = new Template(sources)

        expect(template.domTemplate.childNodes.length).toBe(3)
        expect(template.dynamicFragments.length).toBe(7)

        const container = document.createElement('div')
        container.appendChild(template.domTemplate.cloneNode(true))
        const placeholder = 'x-ingore-tpl-placeholder'
        const nodePlaceholder = `<${placeholder} data-${placeholder}=""></${placeholder}>`
        const attributePlaceholder = `<${placeholder} data-${placeholder}></${placeholder}>`
        expect(container.innerHTML).toBe(
            `<div><!-- my testing comment -->${nodePlaceholder}</div>` +
            `${nodePlaceholder}<div>` +
            // tslint:disable-next-line max-line-length
            `<p class="foo" id="${attributePlaceholder}" data-${placeholder}="<!---->" title="${attributePlaceholder}">${nodePlaceholder}</p>` +
            `<button data-${placeholder}="<!---->">${nodePlaceholder}</button>` +
            '</div>',
        )
        expect(template.dynamicFragments).toEqual([
            {
                nodeIndex: 0,
                target: '',
                type: NodeFragment,
            },
            {
                nodeIndex: 1,
                target: '',
                type: NodeFragment,
            },
            {
                nodeIndex: 2,
                target: 'id',
                type: AttributeFragment,
            },
            {
                nodeIndex: 2,
                target: 'title',
                type: AttributeFragment,
            },
            {
                nodeIndex: 3,
                target: '',
                type: NodeFragment,
            },
            {
                nodeIndex: 4,
                target: 'disabled',
                type: PropertyFragment,
            },
            {
                nodeIndex: 5,
                target: '',
                type: NodeFragment,
            },
        ])
    })

    it('should allow creating a new template instance with the provided key', () => {
        const sources: TemplateStringsArray = [
            '<div><!-- my testing comment -->',
            '</div>',
            '<div><p class="foo" id="',
            '" title="',
            '">',
            '</p><button .disabled="',
            '">',
            '</button></div>',
        ] as any
        (sources as any).raw = sources
        const template = new Template(sources)
        const key = {}
        const instance = template.createInstance(key)
        expect(instance.key).toBe(key)
        expect(instance.template).toBe(template)
        expect(instance.dynamicFragments.length).toBe(template.dynamicFragments.length)
        expect(instance.dom.length).toBe(template.domTemplate.childNodes.length)
        const instance2 = template.createInstance(0)
        for (let i = 0; i < instance.dom.length; i++) {
            expect(instance.dom[i]).not.toBe(instance2.dom[i])
            expect(instance.dom[i]).not.toBe(template.domTemplate.childNodes[i])
            expect(instance.dom[i]).toEqual(instance2.dom[i])
        }
    })
})
