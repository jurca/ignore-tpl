import NodeFragment from '../NodeFragment'

describe('NodeFragment', () => {
    let container1: DocumentFragment
    let container2: DocumentFragment
    let fragment1: NodeFragment
    let fragment2: NodeFragment

    beforeEach(() => {
        container1 = document.createDocumentFragment()
        container1.appendChild(document.createComment(''))
        container2 = document.createDocumentFragment()
        container2.appendChild(document.createElement('p'))
        container2.appendChild(document.createComment(''))
        container2.appendChild(document.createTextNode('foo'))
        fragment1 = new NodeFragment(container1.firstChild as Comment)
        fragment2 = new NodeFragment(container2.childNodes[1] as Comment)
    })

    it('should inject the value before the placeholder node', () => {
        const value = document.createDocumentFragment()
        value.appendChild(document.createTextNode('bar'))
        value.appendChild(document.createElement('p'))
        const random = Math.random()
        value.lastChild!.appendChild(document.createTextNode(`${random}`))
        const expectedValueHTML = `bar<p>${random}</p>`
        const valueNodes = Array.from(value.childNodes)

        fragment1.setValue(value)
        const testingContainer = document.createElement('div')
        testingContainer.appendChild(container1)
        expect(testingContainer.innerHTML).toBe(`${expectedValueHTML}<!---->`)

        // Value nodes have been moved to the container1 fragment (and then to the testingContainer), we have to
        // reclaim them manually.
        for (const node of valueNodes) {
            value.appendChild(node)
        }
        fragment2.setValue(value)
        testingContainer.innerHTML = ''
        testingContainer.appendChild(container2)
        expect(testingContainer.innerHTML).toBe(`<p></p>${expectedValueHTML}<!---->foo`)
    })

    it('should replace the previous value with the new one', () => {
        const container = document.createElement('div')
        container.appendChild(container1)
        fragment1.setValue(createValue1())
        expect(container.innerHTML).toBe('<div></div>foo<!---->')
        fragment1.setValue(createValue2())
        expect(container.innerHTML).toBe('<!--bar--><p></p><!---->')

        container.innerHTML = ''
        container.appendChild(container2)
        fragment2.setValue(createValue1())
        expect(container.innerHTML).toBe('<p></p><div></div>foo<!---->foo')
        fragment2.setValue(createValue2())
        expect(container.innerHTML).toBe('<p></p><!--bar--><p></p><!---->foo')

        function createValue1(): DocumentFragment {
            const value = document.createDocumentFragment()
            value.appendChild(document.createElement('div'))
            value.appendChild(document.createTextNode('foo'))
            return value
        }

        function createValue2(): DocumentFragment {
            const value = document.createDocumentFragment()
            value.appendChild(document.createComment('bar'))
            value.appendChild(document.createElement('p'))
            return value
        }
    })

    it('should do nothing if the value does not change', () => {
        const container = document.createElement('div')
        const value = document.createElement('span')
        const containerSpy = spyOn(container, 'insertBefore').and.callThrough()

        container.appendChild(container1)
        fragment1.setValue(value)
        expect(container.innerHTML).toBe('<span></span><!---->')
        expect(containerSpy).toHaveBeenCalledTimes(1)
        fragment1.setValue(value)
        expect(container.innerHTML).toBe('<span></span><!---->')
        expect(containerSpy).toHaveBeenCalledTimes(1)

        container.innerHTML = ''
        container.appendChild(container2)
        fragment2.setValue(value)
        expect(container.innerHTML).toBe('<p></p><span></span><!---->foo')
        expect(containerSpy).toHaveBeenCalledTimes(2)
        fragment2.setValue(value)
        expect(container.innerHTML).toBe('<p></p><span></span><!---->foo')
        expect(containerSpy).toHaveBeenCalledTimes(2)
    })
})
