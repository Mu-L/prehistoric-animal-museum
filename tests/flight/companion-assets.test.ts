import {readFile} from 'node:fs/promises'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import {Mesh,type Object3D} from 'three'
import { describe, expect, it, vi } from 'vitest'
import { AnimationClip, Bone, BufferGeometry, Float32BufferAttribute, Group, MeshBasicMaterial, QuaternionKeyframeTrack, Skeleton, SkinnedMesh, MeshStandardMaterial, ShaderLib, Texture, type WebGLRenderer, type Material } from 'three'
import { decorateAnimalRim } from '../../src/flight-experience/environment/animal-rim'
import { createEnvironmentFog } from '../../src/flight-experience/environment/environment-fog'
import { sampleEnvironment } from '../../src/flight-experience/environment/environment-state'
import { decorateShadowFade } from '../../src/flight-experience/environment/shadow-fade'
import { createCompanion, ownFarCompanionTemplate } from '../../src/flight-experience/living/companion-assets'
function fixture() {
  const root = new Group(), bone = new Bone(); bone.name = 'wing'
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0],3))
  const material = new MeshBasicMaterial(), mesh = new SkinnedMesh<BufferGeometry, Material>(geometry,material)
  mesh.add(bone); mesh.bind(new Skeleton([bone])); root.add(mesh)
  const clip = new AnimationClip('Idle', 2, [new QuaternionKeyframeTrack('wing.quaternion',[0,1,2],[0,0,0,1, 0,0,1,0, 0,0,0,1])])
  return { root, bone, geometry, material, mesh, clip }
}
describe('companion resource ownership and original motion', () => {
  it('independent phase never mutates the source or another clone; disposal preserves borrowed assets', () => {
    const source = fixture(), geometryDispose = vi.spyOn(source.geometry,'dispose'), materialDispose = vi.spyOn(source.material,'dispose')
    const a=createCompanion(source.root,source.clip), b=createCompanion(source.root,source.clip,{phase:1})
    const aBone=a.root.getObjectByName('wing')!, bBone=b.root.getObjectByName('wing')!
    expect(aBone).not.toBe(source.bone); expect(aBone).not.toBe(bBone)
    expect(aBone.quaternion.equals(bBone.quaternion)).toBe(false)
    const original = source.bone.quaternion.clone(), other = bBone.quaternion.clone()
    a.setMotionSeconds(.5)
    expect(source.bone.quaternion.equals(original)).toBe(true); expect(bBone.quaternion.equals(other)).toBe(true)
    a.dispose(); a.dispose()
    expect(geometryDispose).not.toHaveBeenCalled(); expect(materialDispose).not.toHaveBeenCalled()
    b.setMotionSeconds(.25); expect(bBone.quaternion.equals(other)).toBe(false)
    b.dispose()
  })
  it('excludes near and far flight clones from coarse landscape shadows without changing their template',()=>{
    const source=fixture();source.mesh.receiveShadow=true
    for(const independentMaterials of [false,true]){
      const actor=createCompanion(source.root,source.clip,{independentMaterials})
      actor.root.traverse(object=>{if(object instanceof Mesh){expect(object.receiveShadow).toBe(false);expect(object.castShadow).toBe(false)}})
      expect(source.mesh.receiveShadow).toBe(true)
      actor.dispose()
    }
  })
  it('far library defers owned geometry release until every clone releases it, and never disposes hero material', () => {
    const source=fixture(), heroMaterial=new MeshBasicMaterial()
    const geometryDispose=vi.spyOn(source.geometry,'dispose'), heroDispose=vi.spyOn(heroMaterial,'dispose'), placeholderDispose=vi.spyOn(source.material,'dispose')
    const library=ownFarCompanionTemplate(source.root,source.clip,heroMaterial), a=library.create(), b=library.create()
    expect(placeholderDispose).toHaveBeenCalledOnce(); expect(library.references).toBe(2)
    library.dispose(); expect(geometryDispose).not.toHaveBeenCalled()
    a.dispose(); expect(library.references).toBe(1); expect(geometryDispose).not.toHaveBeenCalled()
    b.dispose(); expect(library.references).toBe(0); expect(geometryDispose).toHaveBeenCalledOnce()
    library.dispose(); expect(geometryDispose).toHaveBeenCalledOnce(); expect(heroDispose).not.toHaveBeenCalled()
    expect(()=>library.create()).toThrow('released')
  })
  it('rejects the denied PoweredFlap clip',()=> {
    const source=fixture(); expect(()=>createCompanion(source.root,new AnimationClip('PoweredFlap',4,[]))).toThrow('original Idle')
  })
  it('independent fade materials retain fog/rim/skinning hooks and shared world uniforms, while borrowing texture ownership',()=>{
    const source=fixture(),material=new MeshStandardMaterial(),texture=new Texture();material.map=texture
    const textureDispose=vi.spyOn(texture,'dispose'),originalDispose=vi.spyOn(material,'dispose')
    const fog=createEnvironmentFog(sampleEnvironment('evening',0,'sunset-bay'))
    decorateShadowFade(material);fog.decorate(material);decorateAnimalRim(material,fog.uniforms)
    source.mesh.material=material
    const actor=createCompanion(source.root,source.clip,{independentMaterials:true})
    const mesh=actor.root.children[0] as SkinnedMesh,copy=mesh.material as MeshStandardMaterial
    expect(copy).not.toBe(material);expect(copy.map).toBe(texture)
    const shader={...ShaderLib.standard,uniforms:{...ShaderLib.standard.uniforms}}
    copy.onBeforeCompile(shader as Parameters<typeof copy.onBeforeCompile>[0],{} as WebGLRenderer)
    expect(shader.vertexShader).toContain('#include <skinning_vertex>')
    expect(shader.vertexShader).toContain('flightFogView=mvPosition.xyz')
    expect(shader.fragmentShader).toContain('flightShadowWeight')
    expect(shader.fragmentShader).toContain('rimEdge')
    expect(shader.uniforms.sunDirection).toBe(fog.uniforms.sunDirection)
    expect(copy.customProgramCacheKey()).toBe(material.customProgramCacheKey())
    actor.setOpacity(.2);expect(copy.opacity).toBe(.2);expect(material.opacity).toBe(1)
    expect(copy.forceSinglePass).toBe(true)
    const copyDispose=vi.spyOn(copy,'dispose');actor.dispose()
    expect(copyDispose).toHaveBeenCalledOnce();expect(textureDispose).not.toHaveBeenCalled();expect(originalDispose).not.toHaveBeenCalled()
  })

})

it.each(['tupandactylus','rhamphorhynchus'])('preserves independent morph phases and named borrowed materials for %s',async id=>{
 const bytes=await readFile(`src/flight-experience/assets/companions/${id}-far.glb`)
 const buffer=new ArrayBuffer(bytes.byteLength);new Uint8Array(buffer).set(bytes)
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer,'')
 const named=new Map<string,Material>()
 gltf.scene.traverse(object=>{if(object instanceof Mesh)for(const m of materialsOf(object as Mesh<BufferGeometry,Material|Material[]>)){const hero=new MeshStandardMaterial();hero.name=m.name;named.set(m.name,hero)}})
 const disposals=[...named.values()].map(m=>vi.spyOn(m,'dispose'))
 const library=ownFarCompanionTemplate(gltf.scene,gltf.animations[0]!,[...named.values()][0]!,named)
 const a=library.create(),b=library.create({phase:2})
 const morphs=(root:Object3D)=>{const values:number[][]=[];root.traverse(o=>{if(o instanceof Mesh&&o.morphTargetInfluences)values.push([...o.morphTargetInfluences])});return values}
 expect(morphs(a.root)).not.toEqual(morphs(b.root))
 const other=morphs(b.root);a.setMotionSeconds(1);expect(morphs(b.root)).toEqual(other)
 a.root.traverse(o=>{if(o instanceof Mesh)for(const m of materialsOf(o as Mesh<BufferGeometry,Material|Material[]>))expect(m).toBe(named.get(m.name))})
 library.dispose();a.dispose();b.dispose();disposals.forEach(spy=>expect(spy).not.toHaveBeenCalled())
})

function materialsOf(mesh:Mesh<BufferGeometry,Material|Material[]>):Material[]{return Array.isArray(mesh.material)?mesh.material:[mesh.material]}
