import AttributeFragment from '../fragment/AttributeFragment'
import NodeFragment from '../fragment/NodeFragment'
import PropertyFragment from '../fragment/PropertyFragment'
import Template from '../Template'
import TemplateInstance from '../TemplateInstance'

describe('TemplateInstace', () => {
  const PLACEHOLDER = 'x-ingore-tpl-placeholder'

  const sources: TemplateStringsArray = [
    '<div><!-- my testing comment -->',
    '</div><div>', // jsdom incorrectly resolves the parent node of the second placeholder if it is top-level
    '</div><div><p class="foo" id="',
    '" title="',
    '">',
    '</p><button .onclick="',
    '">',
    '</button></div>',
  ] as any
  (sources as any).raw = sources
  const template = new Template(sources)

  it('should not contain placeholder attributes', () => {
    const instance = template.createInstance(undefined)
    expect(instance.asDocumentFragment.querySelectorAll(`[data-${PLACEHOLDER}]`).length).toBe(0)
  })

  it('should have the placeholder elements replaced by empty comments', () => {
    const instance = template.createInstance(0)
    const dom = instance.asDocumentFragment
    expect(dom.querySelectorAll(PLACEHOLDER).length).toBe(0)
    expect(dom.childNodes[0].childNodes.length).toBe(2)
    expect(dom.childNodes[0].childNodes[1]).toBeInstanceOf(Comment)
    expect(dom.childNodes[0].childNodes[1].nodeValue).toBe('')
    expect(dom.childNodes[1].childNodes.length).toBe(1)
    expect(dom.childNodes[1].childNodes[0]).toBeInstanceOf(Comment)
    expect(dom.childNodes[1].childNodes[0].nodeValue).toBe('')
    expect(dom.childNodes[2].childNodes[0].childNodes.length).toBe(1)
    expect(dom.childNodes[2].childNodes[0].childNodes[0]).toBeInstanceOf(Comment)
    expect(dom.childNodes[2].childNodes[0].childNodes[0].nodeValue).toBe('')
    expect(dom.childNodes[2].childNodes[1].childNodes.length).toBe(1)
    expect(dom.childNodes[2].childNodes[1].childNodes[0]).toBeInstanceOf(Comment)
    expect(dom.childNodes[2].childNodes[1].childNodes[0].nodeValue).toBe('')
  })

  it('should return its DOM nodes as document fragment from the .asDocumentFragment property', () => {
    const instance = template.createInstance(0)
    const dom = instance.asDocumentFragment
    let node: null | Node = dom.firstChild
    for (const domNode of instance.dom) {
      expect(node).toBe(domNode)
      node = node && node.nextSibling
    }
  })

  it('should always return a ner document fragment from the asDocumentFragment property', () => {
    const instance = template.createInstance(0)
    const fragment1 = instance.asDocumentFragment
    expect(fragment1.firstChild).toBe(instance.dom[0])
    const fragment2 = instance.asDocumentFragment
    expect(fragment1).not.toBe(fragment2)
    expect(fragment2.firstChild).toBe(instance.dom[0])

    // Creating a new document fragment and adding the template's nodes to its necessarily clears the previous document
    // fragment.
    expect(fragment1.firstChild).toBeNull()
  })

  it('should have the key provided in the constructor', () => {
    const key = {}
    const instance = new TemplateInstance(key, template)
    expect(instance.key).toBe(key)
  })

  it('should have its dynamic fragments set up correctly', () => {
    const instance = template.createInstance(0)
    expect(instance.dynamicFragments.length).toBe(7)
    expect(instance.dynamicFragments[0]).toBeInstanceOf(NodeFragment)
    expect(instance.dynamicFragments[1]).toBeInstanceOf(NodeFragment)
    expect(instance.dynamicFragments[2]).toBeInstanceOf(AttributeFragment)
    expect(instance.dynamicFragments[3]).toBeInstanceOf(AttributeFragment)
    expect(instance.dynamicFragments[4]).toBeInstanceOf(NodeFragment)
    expect(instance.dynamicFragments[5]).toBeInstanceOf(PropertyFragment)
    expect(instance.dynamicFragments[6]).toBeInstanceOf(NodeFragment)
  })

  it('should pass the values provided to the setValues method to the dynamic fragments', () => {
    const instance = template.createInstance(0)
    const callback = jest.fn()
    instance.setValues([
      document.createTextNode('foo'),
      document.createTextNode('bar'),
      'baz',
      'lorem',
      document.createElement('main'),
      callback,
      document.createComment('ipsum dolor sit amet'),
    ])

    const container = document.createElement('div')
    container.appendChild(instance.asDocumentFragment)
    expect(container.innerHTML).toBe(
      '<div><!-- my testing comment -->foo<!----></div><div>bar<!----></div>' +
      '<div>' +
      '<p class="foo" id="baz" title="lorem"><main></main><!----></p>' +
      '<button><!--ipsum dolor sit amet--><!----></button>' +
      '</div>',
    )
    expect((instance.dom[2].childNodes[1] as HTMLButtonElement).onclick).toBe(callback)
  })

  it('should handle root-level node fragments in both mounted and unmounted instances', () => {
    const currentSources: TemplateStringsArray = [
      '',
      '<div></div>',
      '<p></p>',
      '',
    ] as any
    (currentSources as any).raw = currentSources
    const currentTemplate = new Template(currentSources)
    const instance = currentTemplate.createInstance(0)

    const container = document.createElement('div')
    instance.setValues([document.createTextNode('foo'), document.createTextNode('bar'), document.createTextNode('baz')])
    container.appendChild(instance.asDocumentFragment)
    expect(container.innerHTML).toBe('foo<!----><div></div>bar<!----><p></p>baz<!---->')

    instance.setValues([document.createElement('main'), document.createElement('b'), document.createElement('i')])
    expect(container.innerHTML).toBe('<main></main><!----><div></div><b></b><!----><p></p><i></i><!---->')
  })
})
