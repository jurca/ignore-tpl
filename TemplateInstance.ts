import IDynamicFragment from './IDynamicFragment.js'
import NodeFragment from './NodeFragment.js'
import Template from './Template.js'

export default class TemplateInstance {
    public readonly key: any
    public readonly dom: DocumentFragment
    public readonly dynamicFragments: IDynamicFragment[]

    constructor(key: any, template: Template) {
        this.key = key
        this.dom = document.importNode(template.domTemplate, true)
        this.dynamicFragments = template.dynamicFragments.map((declaration) => {
            const targetNode = this.evaluateNodePath(declaration.nodePath)
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

    private evaluateNodePath(nodePath: number[]): Node {
        let result: Node = this.dom
        for (const childIndex of nodePath) {
            result = result.childNodes[childIndex]
        }
        return result
    }
}
