import TemplateData from './TemplateData.js'

export default function tpl(templateSource: string[], ...placeholderValues: any[]): TemplateData {
    return new TemplateData(templateSource, placeholderValues)
}
