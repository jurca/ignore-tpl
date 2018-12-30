import TemplateData from './TemplateData.js'

export default function keyed(key: any): (templateSource: string[], ...placeholderValues: any[]) => TemplateData {
    return function tpl(templateSource: string[], ...placeholderValues: any[]): TemplateData {
        return new TemplateData(key, templateSource, placeholderValues)
    }
}
