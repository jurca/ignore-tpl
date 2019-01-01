import PropertyFragment from '../PropertyFragment'

describe('PropertyFragment', () => {
    it('should set the specified property to the provided value', () => {
        const element = document.createElement('div')
        const fragment = new PropertyFragment(element, 'foobar')
        const value = {}
        fragment.setValue(value)
        expect((element as any).foobar).toBe(value)
    })
})
