import AttributeFragment from './fragment/AttributeFragment.js'
import IDynamicFragment from './fragment/IDynamicFragment.js'
import NodeFragment from './fragment/NodeFragment.js'
import PropertyFragment from './fragment/PropertyFragment.js'
import TemplateInstance from './TemplateInstance.js'

const PLACEHOLDER_VALUE = '@@ingore-tpl-placeholder'
const PLACEHOLDER = `<!--${PLACEHOLDER_VALUE}-->`

export default class Template {
    public readonly domTemplate: DocumentFragment
    public readonly dynamicFragments: IDynamicFragmentDeclaration[]

    constructor(source: string[]) {
        const template = document.createElement('template')
        template.innerHTML = source.join(PLACEHOLDER)
        this.domTemplate = template.content

        const dynamicFragments: IDynamicFragmentDeclaration[] = []
        setUpDynamicFragments(this.domTemplate.childNodes, [])
        this.dynamicFragments = dynamicFragments

        function setUpDynamicFragments(nodes: NodeList, nodePath) {
            for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
                const node = nodes[nodeIndex]
                if (node instanceof Comment && node.nodeValue === PLACEHOLDER_VALUE) {
                    dynamicFragments.push({
                        nodePath: nodePath.concat(nodeIndex),
                        target: '',
                        type: NodeFragment,
                    })
                }
                if (node instanceof Element) {
                    const currentPath = nodePath.concat(nodeIndex)
                    for (const attribute of Array.from(node.attributes)) {
                        if (attribute.value !== PLACEHOLDER) {
                            continue
                        }
                        if (attribute.name.startsWith('.')) {
                            dynamicFragments.push({
                                nodePath: currentPath,
                                target: attribute.name.substring(1),
                                type: PropertyFragment,
                            })
                            node.removeAttribute(attribute.name)
                        } else {
                            dynamicFragments.push({
                                nodePath: currentPath,
                                target: attribute.name,
                                type: AttributeFragment,
                            })
                        }
                    }
                    setUpDynamicFragments(node.childNodes, currentPath)
                }
            }
        }
    }

    public createInstance(key?: any): TemplateInstance {
        return new TemplateInstance(key, this)
    }
}

export interface IDynamicFragmentDeclaration {
    readonly type: (new (element: Element, meta: string) => IDynamicFragment) | (new (marker: Comment) => NodeFragment)
    readonly nodePath: number[]
    readonly target: string
}
