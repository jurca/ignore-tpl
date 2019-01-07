import NodeFragment from './fragment/NodeFragment.js'
import Template, {PLACEHOLDER} from './Template.js'
import TemplateData from './TemplateData.js'
import TemplateInstance from './TemplateInstance.js'

const EMPTY_FRAGMENT = document.createDocumentFragment()

const cache = new Map<string, ITemplateState>()
const nodeFragmentValueCache = new WeakMap<NodeFragment, {lastValue: any, node: Node}>()

export default function render(container: Element, templateData: TemplateData): void {
    const {template, instances} = getTemplateState(templateData)
    const newTemplateInstanceNeeded = !instances.has(container)
    if (newTemplateInstanceNeeded) {
        instances.set(
            container,
            {
                subTemplates: new Map(),
                templateInstance: template.createInstance(templateData.key),
            },
        )
    }
    const {templateInstance, subTemplates} = instances.get(container)!

    templateInstance.setValues(prepareValues(templateInstance, subTemplates, templateData.placeholderValues))

    if (newTemplateInstanceNeeded) {
        container.appendChild(templateInstance.asDocumentFragment)
    }
}

function prepareValues(templateInstance: TemplateInstance, subTemplates: SubTemplatesMap, values: any[]): Node[] {
    return values.map((value, index) => memoizedPrepareValue(templateInstance, subTemplates, value, index))
}

function memoizedPrepareValue(
    templateInstance: TemplateInstance,
    subTemplates: SubTemplatesMap,
    value: any,
    index: number,
): Node {
    const currentFragment = templateInstance.dynamicFragments[index]
    if (value instanceof Array || !(currentFragment instanceof NodeFragment)) {
        return prepareValue(templateInstance, subTemplates, value, index)
    }

    const cacheEntry = nodeFragmentValueCache.get(currentFragment)
    if (cacheEntry && cacheEntry.lastValue === value) {
        return cacheEntry.node
    }

    const node = prepareValue(templateInstance, subTemplates, value, index)
    nodeFragmentValueCache.set(currentFragment, {lastValue: value, node})
    return node
}

function prepareValue(
    templateInstance: TemplateInstance,
    subTemplates: SubTemplatesMap,
    value: any,
    index: number,
): Node {
    if (
        value instanceof Node || // DOM nodes do not need any preparation
        // Only NodeFragments need the value converted to a DOM Node
        (index > -1 && !(templateInstance.dynamicFragments[index] instanceof NodeFragment))
    ) {
        subTemplates.delete(index)
        return value
    }

    if (value === undefined || value === null) {
        subTemplates.delete(index)
        return EMPTY_FRAGMENT
    }

    if (value instanceof TemplateData) {
        if (value.key === undefined) {
            value = new TemplateData({}, value.templateSource, value.placeholderValues)
        }
        value = [value]
    }

    if (value instanceof Array) {
        return prepareArray(templateInstance, subTemplates, value, index)
    }

    subTemplates.delete(index)
    return document.createTextNode(`${value}`)
}

function prepareArray(
    templateInstance: TemplateInstance,
    subTemplates: SubTemplatesMap,
    value: any[],
    index: number,
): DocumentFragment {
    const elements = value.flat(Number.POSITIVE_INFINITY)
    const templateDataElements: TemplateData[] = elements.filter((element) => element instanceof TemplateData)
    const newKeys = new Set(
        templateDataElements
            .filter((element) => element.key !== undefined)
            .map((templateData) => templateData.key),
    )
    if (newKeys.size !== templateDataElements.length) {
        throw new Error('Templates that are inside an array must be keyed. Use the keyed tag instead of tpl.')
    }
    if (!subTemplates.has(index)) {
        subTemplates.set(index, new Map())
    }
    const currentSubTemplates = subTemplates.get(index)!

    // garbage collection
    for (const currentKey of currentSubTemplates.keys()) {
        if (!newKeys.has(currentKey)) {
            currentSubTemplates.delete(currentKey)
            continue
        }
        const currentTemplate = currentSubTemplates.get(currentKey)!.templateInstance.template
        const newTemplateData = templateDataElements.find((element) => element.key === currentKey)!
        const {template: newTemplate} = getTemplateState(newTemplateData)
        if (newTemplate !== currentTemplate) {
            currentSubTemplates.delete(currentKey)
        }
    }

    const result = document.createDocumentFragment()
    for (const element of elements) {
        if (!(element instanceof TemplateData)) {
            result.appendChild(prepareValue(templateInstance, subTemplates, element, -1))
            continue
        }
        const {template} = getTemplateState(element)
        if (!currentSubTemplates.has(element.key)) {
            currentSubTemplates.set(
                element.key,
                {
                    subTemplates: new Map(),
                    templateInstance: template.createInstance(element.key),
                },
            )
        }
        const instanceState = currentSubTemplates.get(element.key)!
        instanceState.templateInstance.setValues(prepareValues(
            instanceState.templateInstance,
            instanceState.subTemplates,
            element.placeholderValues,
        ))
        result.appendChild(instanceState.templateInstance.asDocumentFragment)
    }
    return result
}

function getTemplateState(templateData: TemplateData): ITemplateState {
    const templateCacheKey = templateData.templateSource.join(PLACEHOLDER)
    if (!cache.has(templateCacheKey)) {
        cache.set(templateCacheKey, {template: templateData.createTemplate(), instances: new WeakMap()})
    }

    return cache.get(templateCacheKey)!
}

type SubTemplatesMap = Map<number, Map<any, IInstanceState>> // placeholder index -> key -> template instance

interface ITemplateState {
    template: Template
    instances: WeakMap<Element, IInstanceState>
}

interface IInstanceState {
    templateInstance: TemplateInstance
    subTemplates: SubTemplatesMap
}
