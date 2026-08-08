import { readInitialAppState } from '../src/app-bootstrap'

describe('application bootstrap', () => {
  it('reads the build-time state embedded in a localized museum document', () => {
    document.body.innerHTML = `
      <script id="museum-bootstrap" type="application/json">
        {"animalId":"stegosaurus","locale":"en","preference":"en"}
      </script>
    `

    expect(readInitialAppState()).toEqual({
      animalId: 'stegosaurus',
      locale: 'en',
      preference: 'en',
    })
  })
})
