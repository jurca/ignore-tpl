import TemplateData from './TemplateData.js'

export default function tpl(templateSource: TemplateStringsArray, ...placeholderValues: any[]): TemplateData {
    return new TemplateData(undefined, templateSource, placeholderValues)
}
