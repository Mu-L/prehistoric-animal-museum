import type { Viewpoint } from './viewpoint-catalog'
export type ObservationPhase = 'inactive' | 'preparing' | 'active' | 'returning' | 'failed'
/** Only return metadata is retained. The host keeps one bounded active world window. */
export class ObservationSession<Bookmark> {
  phase: ObservationPhase = 'inactive'
  generation = 0
  target: Viewpoint | null = null
  bookmark: Bookmark | null = null
  sceneryPaused = false
  private deadline = 0
  request(target: Viewpoint, bookmark: Bookmark, now: number) {
    if (this.bookmark === null) { this.bookmark = bookmark; this.sceneryPaused = false }
    this.target = target; this.phase = 'preparing'; this.deadline = now + 20000
    return ++this.generation
  }
  returnToTravel(now: number) {
    if (this.bookmark === null) return this.generation
    this.target = null; this.phase = 'returning'; this.deadline = now + 20000
    return ++this.generation
  }
  complete(token: number): boolean {
    if (token !== this.generation || !['preparing','returning'].includes(this.phase)) return false
    if (this.phase === 'returning') { this.phase = 'inactive'; this.bookmark = null }
    else this.phase = 'active'
    return true
  }
  checkTimeout(now: number) {
    if (['preparing','returning'].includes(this.phase) && now >= this.deadline) { this.phase = 'failed'; this.sceneryPaused = true; return true }
    return false
  }
  suspend() { this.sceneryPaused = true }
  close() { ++this.generation; this.phase = 'inactive'; this.target = null; this.bookmark = null; this.sceneryPaused = true }
}
