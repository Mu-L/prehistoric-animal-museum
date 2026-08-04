const dustCount = 12
const leafCount = 4

/**
 * Forest light is the richest land treatment, but the bounded particle count
 * keeps it calm and leaves the Three.js model unobstructed.
 */
export function ForestAtmosphere() {
  return (
    <div
      aria-hidden="true"
      className="scene-atmosphere forest-atmosphere"
    >
      <span className="forest-sunbeam forest-sunbeam--wide" />
      <span className="forest-sunbeam forest-sunbeam--narrow" />
      <span className="forest-dust">
        {Array.from({ length: dustCount }, (_, index) => (
          <span
            className="forest-dust-particle"
            key={`forest-dust-${index + 1}`}
          />
        ))}
      </span>
      <span className="forest-leaves">
        {Array.from({ length: leafCount }, (_, index) => (
          <span
            className="forest-leaf"
            key={`forest-leaf-${index + 1}`}
          />
        ))}
      </span>
    </div>
  )
}
