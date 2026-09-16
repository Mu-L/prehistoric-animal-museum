import type { TerrainResult } from './terrain-protocol'
import { CHUNK_SIZE, SEGMENTS, clamp } from './world'
export interface DisplayedSurface {
  result: TerrainResult; morph: number; startNormals: Float32Array; startColors: Float32Array
  /** Exact GPU terrainBlend values, including patch transition bands. */
  vertexBlend?: Float32Array
}
const triangleCells = new WeakMap<TerrainResult, Map<number, number[]>>()
function cellsFor(r: TerrainResult) {
  let cells = triangleCells.get(r)
  if (cells) return cells
  cells = new Map(); const n = SEGMENTS[r.lod], step = CHUNK_SIZE / n
  for (let i=0;i<r.indices.length;i+=3) {
    const ids=[r.indices[i]!,r.indices[i+1]!,r.indices[i+2]!]
    const xs=ids.map(id=>r.positions[id*3]!), zs=ids.map(id=>r.positions[id*3+2]!)
    const x0=clamp(Math.floor(Math.min(...xs)/step),0,n-1),x1=clamp(Math.ceil(Math.max(...xs)/step)-1,0,n-1)
    const z0=clamp(Math.floor(Math.min(...zs)/step),0,n-1),z1=clamp(Math.ceil(Math.max(...zs)/step)-1,0,n-1)
    for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const key=z*n+x;const list=cells.get(key)??[];list.push(i);cells.set(key,list)}
  }
  triangleCells.set(r,cells);return cells
}
/** Barycentric sample of exactly the resident's indexed, partially morphed triangles. */
export function sampleDisplayed(surface: DisplayedSurface, x: number, z: number) {
  const { result: r } = surface, n=SEGMENTS[r.lod]
  x=clamp(x,0,CHUNK_SIZE);z=clamp(z,0,CHUNK_SIZE)
  const cell=clamp(Math.floor(z/CHUNK_SIZE*n),0,n-1)*n+clamp(Math.floor(x/CHUNK_SIZE*n),0,n-1)
  const candidates=cellsFor(r).get(cell)??[]
  for(const triangle of candidates){
    const ids=[r.indices[triangle]!,r.indices[triangle+1]!,r.indices[triangle+2]!]
    const [a,b,c]=ids as [number,number,number], ax=r.positions[a*3]!,az=r.positions[a*3+2]!,bx=r.positions[b*3]!,bz=r.positions[b*3+2]!,cx=r.positions[c*3]!,cz=r.positions[c*3+2]!
    const denominator=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz)
    if(Math.abs(denominator)<1e-9)continue
    const u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/denominator,v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/denominator,w=1-u-v
    if(Math.min(u,v,w)<-1e-6)continue
    let height=0;const normal=[0,0,0],color=[0,0,0],weights=[u,v,w]
    ids.forEach((id,k)=>{const weight=weights[k]!,m=surface.vertexBlend?.[id]??surface.morph
      height+=(r.coarseHeights[id]!*(1-m)+r.positions[id*3+1]!*m)*weight
      for(let channel=0;channel<3;channel++){
        normal[channel]!+=(surface.startNormals[id*3+channel]!*(1-m)+r.normals[id*3+channel]!*m)*weight
        color[channel]!+=(surface.startColors[id*3+channel]!*(1-m)+r.colors[id*3+channel]!*m)*weight
      }
    });return {height,normal,color}
  }
  throw new Error(`Terrain triangle coverage missing at ${x},${z}`)
}
