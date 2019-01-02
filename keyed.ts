import TemplateData from './TemplateData.js'

export default function keyed(
    key: any,
): (templateSource: TemplateStringsArray, ...placeholderValues: any[]) => TemplateData {
    if (key === undefined) {
        throw new TypeError('The key cannot be undefined. Specify a valid key or use the tpl template tag instead.')
    }

    return function tpl(templateSource: TemplateStringsArray, ...placeholderValues: any[]): TemplateData {
        return new TemplateData(key, templateSource, placeholderValues)
    }
}
