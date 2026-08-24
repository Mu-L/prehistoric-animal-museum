import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { NodeIO, type Animation, type Document } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import {
  REVIEW_CANDIDATE_AVATAR_PACKAGES,
  type ReviewCandidateAvatarSourceId,
} from '../src/scale-encounter/avatar-review-candidate'

const assetRoot = 'assets/candidates/scale-encounter-child-avatar'
const manifestPath = `${assetRoot}/meshy-scene-avatar-packages.manifest.json`
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const describePrivateAvatarPackages = existsSync(manifestPath)
  ? describe
  : describe.skip
const privateAvatarPostureSuiteTitle =
  'scale encounter complete Meshy V4 package posture'

const jointNames = [
  'Hips',
  'LeftUpLeg',
  'LeftLeg',
  'LeftFoot',
  'LeftToeBase',
  'RightUpLeg',
  'RightLeg',
  'RightFoot',
  'RightToeBase',
  'Spine02',
  'Spine01',
  'Spine',
  'LeftShoulder',
  'LeftArm',
  'LeftForeArm',
  'LeftHand',
  'RightShoulder',
  'RightArm',
  'RightForeArm',
  'RightHand',
  'neck',
  'Head',
  'head_end',
  'headfront',
] as const

interface PackageManifestEntry {
  readonly authoredHeightMeters: number
  readonly clips: readonly string[]
  readonly filename: string
  readonly gender: 'boy' | 'girl'
  readonly id: ReviewCandidateAvatarSourceId
  readonly productionApproved: boolean
  readonly profile:
    | 'land-explorer'
    | 'snow-expedition'
    | 'air-wingsuit'
    | 'water-diver'
  readonly sha256: string
}

interface PackageManifest {
  readonly licenseEvidence: {
    readonly assetVisibility: 'private'
    readonly attestedBy: 'Leon'
    readonly attestedOn: '2026-08-19'
    readonly generatedOrExportedOn: '2026-08-19'
    readonly licenseType: 'Private'
    readonly planAtGeneration: 'Pro'
    readonly projectAuthorization: readonly string[]
    readonly publishedToCommunity: false
    readonly referenceInputRightsAttested: true
    readonly status: 'owner-attested'
    readonly taskIdStatus: 'not-found-in-meshy-web-workspace'
  }
  readonly packages: readonly PackageManifestEntry[]
  readonly productionApproved: boolean
  readonly status: string
}

async function readManifest(): Promise<PackageManifest> {
  return JSON.parse(await readFile(manifestPath, 'utf8')) as PackageManifest
}

async function readPackage(
  entry: PackageManifestEntry,
): Promise<{ readonly bytes: Buffer; readonly document: Document }> {
  const bytes = await readFile(`${assetRoot}/${entry.filename}`)
  return { bytes, document: await io.readBinary(new Uint8Array(bytes)) }
}

function animationNamed(document: Document, name: string): Animation {
  const animation = document
    .getRoot()
    .listAnimations()
    .find((candidate) => candidate.getName() === name)
  expect(animation, `missing animation ${name}`).toBeDefined()
  return animation!
}

describePrivateAvatarPackages(privateAvatarPostureSuiteTitle, () => {
  it('keeps all eight package bytes, roots, anchors, rigs, and approved clips in manifest lockstep', async () => {
    const manifest = await readManifest()
    expect(manifest.status).toBe('local-review-only')
    expect(manifest.productionApproved).toBe(false)
    expect(manifest.licenseEvidence).toMatchObject({
      assetVisibility: 'private',
      attestedBy: 'Leon',
      attestedOn: '2026-08-19',
      generatedOrExportedOn: '2026-08-19',
      licenseType: 'Private',
      planAtGeneration: 'Pro',
      projectAuthorization: [
        'use',
        'modify',
        'distribute-with-application',
      ],
      publishedToCommunity: false,
      referenceInputRightsAttested: true,
      status: 'owner-attested',
      taskIdStatus: 'not-found-in-meshy-web-workspace',
    })
    expect(manifest.packages).toHaveLength(8)
    expect(new Set(manifest.packages.map((entry) => entry.id))).toEqual(
      new Set(Object.keys(REVIEW_CANDIDATE_AVATAR_PACKAGES)),
    )

    for (const entry of manifest.packages) {
      const avatarPackage = REVIEW_CANDIDATE_AVATAR_PACKAGES[entry.id]
      const { bytes, document } = await readPackage(entry)
      const root = document.getRoot()

      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        entry.sha256,
      )
      expect(avatarPackage).toMatchObject({
        authoredHeightMeters: entry.authoredHeightMeters,
        clipNames: entry.clips,
        filename: entry.filename,
        gender: entry.gender,
        packageSha256: entry.sha256,
        profile: entry.profile,
        sceneRootName: 'ChildAvatarV4Root',
        variantId: entry.id,
      })
      expect(entry.productionApproved).toBe(false)

      expect(root.listScenes()).toHaveLength(1)
      expect(root.listScenes()[0]?.getName()).toBe('ChildAvatarV4Root')
      expect(root.listScenes()[0]?.listChildren()[0]?.getName()).toBe(
        'ChildAvatarV4Root',
      )
      expect(root.listNodes()).toHaveLength(28)
      expect(
        root.listNodes().filter((node) => node.getName() === 'EyeAnchor'),
      ).toHaveLength(1)
      expect(
        root
          .listNodes()
          .filter((node) => node.getName().startsWith('avatar-equipment-')),
      ).toEqual([])
      expect(root.listMeshes()).toHaveLength(1)
      expect(root.listSkins()).toHaveLength(1)
      expect(root.listSkins()[0]?.getInverseBindMatrices()?.getCount()).toBe(24)
      expect(
        root.listSkins()[0]?.listJoints().map((joint) => joint.getName()),
      ).toEqual(jointNames)
      expect(
        root.listAnimations().map((animation) => animation.getName()),
      ).toEqual(entry.clips)

      for (const animation of root.listAnimations()) {
        const isJump = animation.getName() === 'Jump_Land'
        expect(animation.listChannels()).toHaveLength(
          isJump ? 25 : 72,
        )
        expect(animation.listSamplers()).toHaveLength(
          isJump ? 25 : 72,
        )
        const targets = new Set(
          animation.listChannels().map((channel) => {
            const target = channel.getTargetNode()
            return `${target?.getName()}:${channel.getTargetPath()}`
          }),
        )
        for (const jointName of jointNames) {
          expect(targets).toContain(`${jointName}:rotation`)
          if (isJump) {
            if (jointName === 'Hips') {
              expect(targets).toContain('Hips:translation')
            } else {
              expect(targets).not.toContain(`${jointName}:translation`)
            }
            expect(targets).not.toContain(`${jointName}:scale`)
          } else {
            expect(targets).toContain(`${jointName}:translation`)
            expect(targets).toContain(`${jointName}:scale`)
          }
        }
      }
    }
  })

  it('keeps every default scene pose motionless over its one-second static loop', async () => {
    const manifest = await readManifest()

    for (const entry of manifest.packages) {
      const { document } = await readPackage(entry)
      const defaultClipName =
        REVIEW_CANDIDATE_AVATAR_PACKAGES[entry.id].defaultClipName
      const animation = animationNamed(document, defaultClipName)
      expect(animation.listChannels()).toHaveLength(72)

      for (const channel of animation.listChannels()) {
        const sampler = channel.getSampler()!
        const input = sampler.getInput()!
        const output = sampler.getOutput()!
        expect(Array.from(input.getArray() ?? [])).toEqual([0, 1])
        expect(output.getCount()).toBe(2)
        const first = output.getElement(0, [] as number[])
        const last = output.getElement(1, [] as number[])
        expect(last).toHaveLength(first.length)
        for (let index = 0; index < first.length; index += 1) {
          expect(last[index]).toBeCloseTo(first[index]!, 6)
        }
      }
    }
  })

  it('keeps approved land locomotion in place and loop-closed', async () => {
    const manifest = await readManifest()
    const landEntries = manifest.packages.filter(
      (entry) =>
        entry.profile === 'land-explorer' ||
        entry.profile === 'snow-expedition',
    )

    for (const entry of landEntries) {
      const { document } = await readPackage(entry)
      const locomotionClips = entry.clips.filter(
        (clip) => clip.startsWith('Walk_') || clip.startsWith('Run_'),
      )
      expect(locomotionClips.length).toBeGreaterThan(0)
      for (const clipName of locomotionClips) {
        const animation = animationNamed(document, clipName)
        const hipsTranslation = animation.listChannels().find(
          (channel) =>
            channel.getTargetNode()?.getName() === 'Hips' &&
            channel.getTargetPath() === 'translation',
        )
        expect(hipsTranslation).toBeDefined()
        const output = hipsTranslation!.getSampler()!.getOutput()!
        const first = output.getElement(0, [] as number[])
        const last = output.getElement(output.getCount() - 1, [] as number[])
        for (let index = 0; index < first.length; index += 1) {
          expect(last[index]).toBeCloseTo(first[index]!, 4)
        }
        const expectedDuration = clipName.startsWith('Run_')
          ? 0.633333
          : 1.033333
        const times = Array.from(
          animation.listSamplers()[0]?.getInput()?.getArray() ?? [],
        )
        expect(times.at(-1)! - times[0]!).toBeCloseTo(expectedDuration, 5)
      }
    }
  })

  it('keeps each land jump package-local with visible knee flexion and no horizontal root travel', async () => {
    const manifest = await readManifest()
    const landEntries = manifest.packages.filter(
      (entry) =>
        entry.profile === 'land-explorer' ||
        entry.profile === 'snow-expedition',
    )

    expect(landEntries).toHaveLength(4)
    for (const entry of landEntries) {
      const { document } = await readPackage(entry)
      const jump = animationNamed(document, 'Jump_Land')
      expect(jump.listChannels()).toHaveLength(jointNames.length + 1)
      const rotationChannels = jump
        .listChannels()
        .filter((channel) => channel.getTargetPath() === 'rotation')
      const translationChannels = jump
        .listChannels()
        .filter((channel) => channel.getTargetPath() === 'translation')
      expect(rotationChannels).toHaveLength(jointNames.length)
      expect(translationChannels).toHaveLength(1)
      expect(translationChannels[0]?.getTargetNode()?.getName()).toBe('Hips')

      const times = Array.from(
        jump.listSamplers()[0]?.getInput()?.getArray() ?? [],
      )
      expect(times[0]).toBe(0)
      expect(times.at(-1)).toBeCloseTo(0.9, 6)

      const hipsTranslation = translationChannels[0]!
        .getSampler()!
        .getOutput()!
      const firstHips = hipsTranslation.getElement(0, [] as number[])
      const lastHips = hipsTranslation.getElement(
        hipsTranslation.getCount() - 1,
        [] as number[],
      )
      let minimumVerticalDelta = 0
      let maximumHorizontalDelta = 0
      for (let index = 0; index < hipsTranslation.getCount(); index += 1) {
        const sample = hipsTranslation.getElement(index, [] as number[])
        minimumVerticalDelta = Math.min(
          minimumVerticalDelta,
          sample[1]! - firstHips[1]!,
        )
        maximumHorizontalDelta = Math.max(
          maximumHorizontalDelta,
          Math.abs(sample[0]! - firstHips[0]!),
          Math.abs(sample[2]! - firstHips[2]!),
        )
      }
      expect(minimumVerticalDelta).toBeLessThanOrEqual(-8)
      expect(maximumHorizontalDelta).toBeLessThan(0.001)
      for (let component = 0; component < firstHips.length; component += 1) {
        expect(lastHips[component]).toBeCloseTo(firstHips[component]!, 4)
      }

      let changedJointCount = 0
      for (const channel of rotationChannels) {
        const output = channel.getSampler()!.getOutput()!
        const first = output.getElement(0, [] as number[])
        const last = output.getElement(output.getCount() - 1, [] as number[])
        const changed = Array.from({ length: output.getCount() }).some(
          (_, index) => {
            const sample = output.getElement(index, [] as number[])
            return sample.some(
              (value, component) =>
                Math.abs(value - first[component]!) > 0.001,
            )
          },
        )
        if (changed) changedJointCount += 1
        for (let index = 0; index < first.length; index += 1) {
          expect(last[index]).toBeCloseTo(first[index]!, 5)
        }
      }
      expect(changedJointCount).toBeGreaterThanOrEqual(10)

      for (const kneeName of ['LeftLeg', 'RightLeg']) {
        const knee = rotationChannels.find(
          (channel) => channel.getTargetNode()?.getName() === kneeName,
        )!
        const output = knee.getSampler()!.getOutput()!
        const first = output.getElement(0, [] as number[])
        let maximumAngularChange = 0
        for (let index = 0; index < output.getCount(); index += 1) {
          const sample = output.getElement(index, [] as number[])
          const dot = Math.abs(
            sample.reduce(
              (sum, component, componentIndex) =>
                sum + component * first[componentIndex]!,
              0,
            ),
          )
          maximumAngularChange = Math.max(
            maximumAngularChange,
            2 * Math.acos(Math.min(1, dot)),
          )
        }
        expect(maximumAngularChange).toBeGreaterThan(0.7)
      }

      for (const [armName, minimumAngularChange] of [
        ['LeftArm', 1.7],
        ['RightArm', 1.7],
        ['LeftForeArm', 0.45],
        ['RightForeArm', 0.45],
      ] as const) {
        const arm = rotationChannels.find(
          (channel) => channel.getTargetNode()?.getName() === armName,
        )!
        const output = arm.getSampler()!.getOutput()!
        const first = output.getElement(0, [] as number[])
        let maximumAngularChange = 0
        for (let index = 0; index < output.getCount(); index += 1) {
          const sample = output.getElement(index, [] as number[])
          const dot = Math.abs(
            sample.reduce(
              (sum, component, componentIndex) =>
                sum + component * first[componentIndex]!,
              0,
            ),
          )
          maximumAngularChange = Math.max(
            maximumAngularChange,
            2 * Math.acos(Math.min(1, dot)),
          )
        }
        expect(maximumAngularChange).toBeGreaterThanOrEqual(
          minimumAngularChange,
        )
      }
    }
  })
})
