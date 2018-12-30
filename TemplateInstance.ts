import IDynamicFragment from './fragment/IDynamicFragment.js'
import NodeFragment from './fragment/NodeFragment.js'
import Template from './Template.js'

export default class TemplateInstance {
    public readonly key: any
    public readonly dom: Node[]
    public readonly dynamicFragments: IDynamicFragment[]

    constructor(key: any, template: Template) {
        this.key = key
        const domInstance = template.domTemplate.cloneNode(true)
        this.dom = Array.from(domInstance.childNodes)
        this.dynamicFragments = template.dynamicFragments.map((declaration) => {
            const targetNode = this.evaluateNodePath(domInstance, declaration.nodePath)
            if (declaration.type === NodeFragment) {
                return new declaration.type(targetNode as Comment)
            }
            const constructor = declaration.type as new (element: Element, meta: string) => IDynamicFragment
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

    private evaluateNodePath(rootNode: Node, nodePath: number[]): Node {
        let result: Node = rootNode
        for (const childIndex of nodePath) {
            result = result.childNodes[childIndex]
        }
        return result
    }
}
