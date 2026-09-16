import type { FlightInput } from './simulation'
export function isFlightShortcutTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && !!target.closest('button,input,select,textarea,a,[contenteditable="true"],[role="dialog"] input')
}
export class FlightInputState {
  private readonly keys = new Set<string>()
  private pointer: FlightInput = { turn: 0, climb: 0 }
  key(code: string, pressed: boolean) { if (pressed) this.keys.add(code); else this.keys.delete(code) }
  point(turn: number, climb: number) { this.pointer = { turn, climb } }
  clear() { this.keys.clear(); this.pointer = { turn: 0, climb: 0 } }
  read(): FlightInput {
    const has = (...keys: string[]) => keys.some(k => this.keys.has(k)) ? 1 : 0
    return {
      turn: Math.max(-1, Math.min(1, has('ArrowRight', 'KeyD') - has('ArrowLeft', 'KeyA') + this.pointer.turn)),
      climb: Math.max(-1, Math.min(1, has('ArrowUp', 'KeyW') - has('ArrowDown', 'KeyS') + this.pointer.climb)),
    }
  }
}
