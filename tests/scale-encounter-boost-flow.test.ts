import {
  PerspectiveCamera,
  Scene,
  type LineBasicMaterial,
  type LineSegments,
  type Points,
  type PointsMaterial,
} from 'three'
import { describe, expect, it, vi } from 'vitest'
import { createScaleEncounterBoostFlowEffect } from '../src/viewer/scale-encounter-boost-flow'

describe('scale encounter boost flow', () => {
  it('does not allocate a flow layer for land encounters', () => {
    expect(createScaleEncounterBoostFlowEffect('land')).toBeNull()
  })

  it('shows camera-relative bubbles and water streaks only while boost eases in', () => {
    const effect = createScaleEncounterBoostFlowEffect('water')!
    const scene = new Scene()
    scene.add(effect.root)
    const camera = new PerspectiveCamera()
    camera.position.set(3, 2, -4)
    camera.rotation.set(0.1, -0.35, 0)
    camera.updateMatrixWorld(true)

    const bubbles = effect.root.getObjectByName(
      'scale-encounter-water-boost-bubbles',
    ) as Points
    const streams = effect.root.getObjectByName(
      'scale-encounter-water-boost-streams',
    ) as LineSegments
    expect(bubbles.userData.scaleEncounterBoostParticleCount).toBe(42)
    expect(streams.userData.scaleEncounterBoostStreamCount).toBe(14)
    const bubbleMaterial = bubbles.material as PointsMaterial
    const streamMaterial = streams.material as LineBasicMaterial
    const positionsBefore = Array.from(
      bubbles.geometry.getAttribute('position').array,
    )

    effect.update(1 / 60, camera, false)
    expect(effect.root.visible).toBe(false)
    effect.setIntensity(1)
    effect.update(0.1, camera, false)

    expect(effect.root.visible).toBe(true)
    expect(effect.root.position.distanceTo(camera.position)).toBeLessThan(1e-8)
    expect(effect.root.quaternion.angleTo(camera.quaternion)).toBeLessThan(1e-8)
    expect(bubbleMaterial.opacity).toBeCloseTo(0.72, 6)
    expect(streamMaterial.opacity).toBeCloseTo(0.13, 6)
    expect(
      Array.from(bubbles.geometry.getAttribute('position').array),
    ).not.toEqual(positionsBefore)

    effect.update(0.1, camera, true)
    expect(effect.root.visible).toBe(false)
    expect(bubbleMaterial.opacity).toBe(0)
    expect(streamMaterial.opacity).toBe(0)

    const bubbleGeometryDispose = vi.spyOn(bubbles.geometry, 'dispose')
    const streamGeometryDispose = vi.spyOn(streams.geometry, 'dispose')
    effect.dispose()
    expect(effect.root.parent).toBeNull()
    expect(effect.root.children).toHaveLength(0)
    expect(bubbleGeometryDispose).toHaveBeenCalledOnce()
    expect(streamGeometryDispose).toHaveBeenCalledOnce()
  })

  it('keeps the sky treatment to sparse, low-opacity airflow lines', () => {
    const effect = createScaleEncounterBoostFlowEffect('air')!
    const camera = new PerspectiveCamera()
    camera.position.set(-2, 4, 8)
    camera.updateMatrixWorld(true)
    const streams = effect.root.getObjectByName(
      'scale-encounter-air-boost-streams',
    ) as LineSegments

    expect(
      effect.root.getObjectByName('scale-encounter-water-boost-bubbles'),
    ).toBeUndefined()
    expect(streams.userData.scaleEncounterBoostStreamCount).toBe(20)
    effect.setIntensity(0.6)
    effect.update(0.1, camera, false)

    expect(effect.root.visible).toBe(true)
    expect((streams.material as LineBasicMaterial).opacity).toBeCloseTo(
      0.114,
      6,
    )
    effect.dispose()
  })
})
