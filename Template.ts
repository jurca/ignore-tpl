import AttributeFragment from './fragment/AttributeFragment.js'
import IDynamicFragment from './fragment/IDynamicFragment.js'
import NodeFragment from './fragment/NodeFragment.js'
import PropertyFragment from './fragment/PropertyFragment.js'
import TemplateInstance from './TemplateInstance.js'

const PLACEHOLDER_PATTERN = 'x-ingore-tpl-placeholder'
export const PLACEHOLDER_ATTRIBUTE = `data-${PLACEHOLDER_PATTERN}`
const PLACEHOLDER_ELEMENT = `<${PLACEHOLDER_PATTERN} ${PLACEHOLDER_ATTRIBUTE}></${PLACEHOLDER_PATTERN}>`
const PLACEHOLDER_NODE_NAME = PLACEHOLDER_PATTERN.toUpperCase()
export const PLACEHOLDER = `${PLACEHOLDER_ELEMENT}" ${PLACEHOLDER_ATTRIBUTE}="<!---->`

export default class Template {
    public readonly domTemplate: DocumentFragment
    public readonly dynamicFragments: IDynamicFragmentDeclaration[]

    constructor(source: string[]) {
        const template = document.createElement('template')
        template.innerHTML = source.join(PLACEHOLDER)
        this.domTemplate = template.content
        this.dynamicFragments = setUpDynamicFragments(
            Array.from(this.domTemplate.querySelectorAll(`[${PLACEHOLDER_ATTRIBUTE}]`)),
        )
    }

    public createInstance(key?: any): TemplateInstance {
        return new TemplateInstance(key, this)
    }
}

export interface IDynamicFragmentDeclaration {
    readonly type: (new (element: Element, meta: string) => IDynamicFragment) | (new (marker: Comment) => NodeFragment)
    readonly nodeIndex: number
    readonly target: string
}

function setUpDynamicFragments(nodes: Element[]): IDynamicFragmentDeclaration[] {
    const dynamicFragments: IDynamicFragmentDeclaration[] = []
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
        const node = nodes[nodeIndex]
        if (node.nodeName === PLACEHOLDER_NODE_NAME) {
            dynamicFragments.push({
                nodeIndex,
                target: '',
                type: NodeFragment,
            })
            node.parentNode!.removeChild(node.nextSibling!) // text
            node.parentNode!.removeChild(node.nextSibling!) // comment
            continue
        }

        for (const attribute of Array.from(node.attributes)) {
            if (attribute.value !== PLACEHOLDER_ELEMENT) {
                continue
            }
            if (attribute.name[0] === '.') {
                dynamicFragments.push({
                    nodeIndex,
                    target: attribute.name.substring(1),
                    type: PropertyFragment,
                })
                node.removeAttribute(attribute.name)
                continue
            }
            dynamicFragments.push({
                nodeIndex,
                target: attribute.name,
                type: AttributeFragment,
            })
        }
    }
    return dynamicFragments
}
