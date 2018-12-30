import IDynamicFragment from './IDynamicFragment.js'
import TemplateInstance from './TemplateInstance.js'

const EMPTY_FRAGMENT = document.createDocumentFragment()

export default class NodeFragment implements IDynamicFragment {
    private readonly start: null | Node
    private readonly end: Comment

    constructor(endNode: Comment) {
        this.start = endNode.previousSibling
        this.end = endNode
    }

    public setValue(value: any): void {
        const {end, start} = this
        const container = end.parentNode!
        while (end.previousSibling !== start) {
            container.removeChild(end.previousSibling!)
        }

        if (value === undefined || value === null) {
            return
        }
        container.insertBefore(this.prepareValue(value), end)
    }

    private prepareValue(value: any): Node {
        if (value === undefined || value === null) {
            return EMPTY_FRAGMENT
        }
        if (value instanceof Node) {
            return value
        }
        if (value instanceof Array) {
            const result = document.createDocumentFragment()
            for (const subValue of value) {
                result.appendChild(this.prepareValue(subValue))
            }
            return result
        }
        // We'll leave mapping of TemplateData instances to TemplateInstance instances to the client code to allow
        // various caching mechanisms and behavior extensions. The client code can check which values will be set to
        // NodeFragments by  inspecting which <TemplateInstance instance>.dynamicFragments elements (their indexes
        // reflex template value indexes) are NodeFragment instances.
        if (value instanceof TemplateInstance) {
            return value.asDocumentFragment
        }
        return document.createTextNode(`${value}`)
    }
}
