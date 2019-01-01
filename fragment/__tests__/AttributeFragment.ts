import AttributeFragment from '../AttributeFragment'

describe('AttributeFragment', () => {
    it('should set the specified attribute to the provided value', () => {
        const element = document.createElement('div')
        const fragment = new AttributeFragment(element, 'class')
        const value = `testing-${Math.random()}`
        fragment.setValue(value)
        expect(element.className).toBe(value)
    })

    it('should not call setAttribute multiple times with the same value', () => {
        const element = document.createElement('div')
        const fragment = new AttributeFragment(element, 'class')
        const value = `foo_${Math.random()}`
        const setAttributeSpy = spyOn(element, 'setAttribute')
        fragment.setValue(value)
        fragment.setValue(value)
        expect(setAttributeSpy).toHaveBeenCalledTimes(1)
    })

    it('should remove the attribute if the value is undefined or null', () => {
        const element = document.createElement('div')
        const fragment = new AttributeFragment(element, 'class')
        element.className = 'fooBar'
        fragment.setValue(null)
        expect(element.attributes.length).toBe(0)
        fragment.setValue(1)
        expect(element.attributes.length).toBe(1)
        fragment.setValue(undefined)
        expect(element.attributes.length).toBe(0)
    })

    it('should not call removeAttribute multiple times', () => {
        const element = document.createElement('div')
        const fragment = new AttributeFragment(element, 'class')
        element.className = `bar-${Math.random()}`
        const removeAttributeSpy = spyOn(element, 'removeAttribute')
        fragment.setValue(null)
        fragment.setValue(null)
        expect(removeAttributeSpy).toHaveBeenCalledTimes(1)
    })
})
