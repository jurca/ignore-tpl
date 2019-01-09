import IDynamicFragment from './fragment/IDynamicFragment.js'
import NodeFragment from './fragment/NodeFragment.js'
import Template, {PLACEHOLDER_ATTRIBUTE} from './Template.js'

export default class TemplateInstance {
    public readonly key: any
    public readonly dynamicFragments: IDynamicFragment[]
    public readonly template: Template
    private readonly staticDom: Node[]
    private currentDom: Node[]

    constructor(key: any, template: Template) {
        this.key = key
        this.template = template
        const domInstance = template.domTemplate.cloneNode(true) as DocumentFragment
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
        this.staticDom = Array.from(domInstance.childNodes)
        this.currentDom = this.staticDom
    }

    public get dom(): Node[] {
        return this.currentDom
    }

    public setValues(placeholderValues: any[]): void {
        for (let i = 0; i < placeholderValues.length; i++) {
            this.dynamicFragments[i].setValue(placeholderValues[i])
        }

        if (!this.staticDom.length) {
            return
        }

        const nodeValues = new Set(placeholderValues.filter((value) => value instanceof Node))
        let startNode = this.staticDom[0]
        while (nodeValues.has(startNode.previousSibling)) {
            startNode = startNode.previousSibling!
        }

        this.currentDom = []
        let currentNode = startNode
        const lastNode = this.staticDom[this.staticDom.length - 1]
        while (currentNode !== lastNode) {
            this.currentDom.push(currentNode)
            currentNode = currentNode.nextSibling!
        }
        this.currentDom.push(lastNode)
    }

    public get asDocumentFragment(): DocumentFragment {
        const result = document.createDocumentFragment()
        for (const node of this.dom) {
            result.appendChild(node)
        }
        return result
    }
}
