import IDynamicFragment from './fragment/IDynamicFragment.js'
import NodeFragment from './fragment/NodeFragment.js'
import Template, {PLACEHOLDER_ATTRIBUTE} from './Template.js'

export default class TemplateInstance {
    public readonly key: any
    public readonly dom: Node[]
    public readonly dynamicFragments: IDynamicFragment[]
    public readonly template: Template

    constructor(key: any, template: Template) {
        this.key = key
        this.template = template
        const domInstance = template.domTemplate.cloneNode(true) as DocumentFragment
        this.dom = Array.from(domInstance.childNodes)
        const dynamicNodes = Array.from(domInstance.querySelectorAll(`[${PLACEHOLDER_ATTRIBUTE}]`))
        this.dynamicFragments = template.dynamicFragments.map((declaration) => {
            const targetNode = dynamicNodes[declaration.nodeIndex]
            if (declaration.type === NodeFragment) {
                const fragmentMarker = document.createComment('')
                targetNode.parentNode!.replaceChild(fragmentMarker, targetNode)
                return new declaration.type(fragmentMarker)
            }
            const constructor = declaration.type as new (element: Element, meta: string) => IDynamicFragment
            targetNode.removeAttribute(PLACEHOLDER_ATTRIBUTE)
            return new constructor(targetNode as Element, declaration.target)
        })
    }

    public setValues(placeholderValues: any[]): void {
        for (let i = 0; i < placeholderValues.length; i++) {
            this.dynamicFragments[i].setValue(placeholderValues[i])
        }
    }

    public get asDocumentFragment(): DocumentFragment {
        const result = document.createDocumentFragment()
        for (const node of this.dom) {
            result.appendChild(node)
        }
        return result
    }
}
