import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

interface RuntimeAssetApproval {
  readonly assetGroups: {
    readonly avatars: { readonly binaryCount: number; readonly status: string }
    readonly environments: {
      readonly binaryCount: number
      readonly status: string
    }
    readonly narration: { readonly binaryCount: number; readonly status: string }
  }
  readonly approvedBy: string
  readonly approvedOn: string
  readonly productionApproved: boolean
  readonly publicDistributionDecision: string
  readonly status: string
}

const assetRoot = resolve(process.cwd(), 'src/scale-encounter/assets')
const binaryExtensions = new Set(['.glb', '.png', '.webp'])

function collectBinaryAssets(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name)
    if (entry.isDirectory()) return collectBinaryAssets(absolutePath)
    return entry.isFile() && binaryExtensions.has(extname(entry.name))
      ? [relative(assetRoot, absolutePath)]
      : []
  })
}

describe('scale encounter approved runtime assets', () => {
  it('locks every promoted avatar and environment byte to owner approval', () => {
    const approval = JSON.parse(
      readFileSync(join(assetRoot, 'approval.json'), 'utf8'),
    ) as RuntimeAssetApproval
    expect(approval).toMatchObject({
      approvedBy: 'Leon',
      approvedOn: '2026-09-01',
      productionApproved: true,
      publicDistributionDecision: 'approved',
      status: 'production-approved',
    })
    expect(approval.assetGroups).toMatchObject({
      avatars: { binaryCount: 10, status: 'production-approved' },
      environments: { binaryCount: 55, status: 'production-approved' },
      narration: { binaryCount: 148, status: 'production-approved' },
    })

    const recorded = new Map(
      readFileSync(join(assetRoot, 'SHA256SUMS'), 'utf8')
        .trim()
        .split('\n')
        .map((line) => {
          const match = line.match(/^([a-f0-9]{64}) {2}(.+)$/)
          if (!match) throw new Error(`invalid-runtime-checksum-line:${line}`)
          return [match[2]!, match[1]!] as const
        }),
    )
    const binaries = [
      ...collectBinaryAssets(join(assetRoot, 'avatars')),
      ...collectBinaryAssets(join(assetRoot, 'environments')),
    ].sort()

    expect(recorded.size).toBe(65)
    expect([...recorded.keys()].sort()).toEqual(binaries)
    for (const [fileName, expectedHash] of recorded) {
      const bytes = readFileSync(join(assetRoot, fileName))
      expect(createHash('sha256').update(bytes).digest('hex'), fileName).toBe(
        expectedHash,
      )
    }
  })
})
