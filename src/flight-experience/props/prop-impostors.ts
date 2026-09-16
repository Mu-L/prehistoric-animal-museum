import { DoubleSide, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader, type Mesh, type Texture } from 'three'
import manifest from '../assets/ecology-r5/manifest.json'
const urls = import.meta.glob<string>('../assets/ecology-r5/tree-*.png', { query: '?url', import: 'default', eager: true })
export interface ImpostorPart { geometry: PlaneGeometry; material: MeshStandardMaterial }
/** Unlit colour captured from the same source: runtime light remains dynamic. Three
 * alpha-tested planes give front/side/top silhouettes with real-world dimensions. */
export async function loadPropImpostors(): Promise<Map<string, ImpostorPart[]>> {
  const textures = new Set<Texture>(), parts = new Map<string, ImpostorPart[]>()
  try {
    for (const asset of manifest.assets.filter(a => a.kind === 'plant')) {
      const size = Math.max(asset.physicalHeight, asset.footprint.radius * 2) * 1.15, list: ImpostorPart[] = []
      parts.set(asset.id, list)
      for (const view of [0, 1, 4]) {
        const url = urls[`../assets/ecology-r5/${asset.id}-${view}.png`]
        if (!url) throw new Error(`Missing same-source tree silhouette ${asset.id}`)
        const texture = await new TextureLoader().loadAsync(url); textures.add(texture); texture.colorSpace = SRGBColorSpace
        const geometry = new PlaneGeometry(size, size)
        if (view === 0) geometry.rotateY(Math.PI / 2)
        if (view === 4) geometry.rotateX(-Math.PI / 2)
        geometry.translate(0, asset.physicalHeight / 2, 0)
        const material = new MeshStandardMaterial({ map: texture, alphaTest: .42, side: DoubleSide, roughness: .9, metalness: 0 })
        list.push({ geometry, material })
      }
    }
    return parts
  } catch (error) {
    textures.forEach(t => t.dispose()); for (const list of parts.values()) for (const part of list) { part.geometry.dispose(); part.material.dispose() }
    throw error
  }
}
export function disposeMeshResources(meshes: Mesh[]) {
  const textures = new Set<Texture>()
  for (const mesh of meshes) {
    mesh.geometry.dispose()
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const map = (material as MeshStandardMaterial).map; if (map) textures.add(map)
      material.dispose()
    }
  }
  textures.forEach(t => t.dispose())
}
