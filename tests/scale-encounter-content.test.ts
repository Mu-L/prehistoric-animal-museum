import {
  isScaleEncounterAnimal,
  scaleEncounterContentFor,
} from '../src/scale-encounter/content'
import { SCALE_ENCOUNTER_ANIMAL_IDS } from '../src/scale-encounter/types'

describe('scale encounter content', () => {
  it('enables all eighteen published animals from one catalog', () => {
    expect(SCALE_ENCOUNTER_ANIMAL_IDS).toHaveLength(18)
    for (const animalId of SCALE_ENCOUNTER_ANIMAL_IDS) {
      expect(isScaleEncounterAnimal(animalId)).toBe(true)
    }
    expect(isScaleEncounterAnimal('not-an-animal')).toBe(false)
  })

  it('explains that height sets the eye view and every scene is imaginary', () => {
    const zh = scaleEncounterContentFor('pteranodon', 'zh-CN')
    const english = scaleEncounterContentFor('pteranodon', 'en')

    expect(zh.copy.setup.subtitle).toContain('眼睛视角')
    expect(zh.copy.setup.subtitle).toContain('探险装备')
    expect(zh.copy.setup.subtitle).toContain('想象')
    expect(english.copy.setup.subtitle).toContain('same functional')
    expect(english.copy.setup.subtitle).toContain('imaginative encounter')
    expect(zh.copy.setup.fieldApproach).toBe('想离动物多近？')
    expect(zh.copy.setup.approachHelp).toContain('动物身体外面一点点')
    expect(zh.copy.setup.approachHelp).toContain('一起打卡')
  })

  it('describes Megalodon as sixteen metres and compares length with a bus', () => {
    const zh = scaleEncounterContentFor('megalodon', 'zh-CN')
    const english = scaleEncounterContentFor('megalodon', 'en')
    const narration = `${zh.copy.intro}${zh.copy.transition}${zh.copy.arrival}`

    expect(zh.copy.measurement).toContain('约 16 米')
    expect(zh.copy.arrival).toContain('比一辆大巴还要长')
    expect(narration).not.toMatch(/十六米半|哪片蓝色海水|还要远/)
    expect(english.copy.measurement).toContain('About 16 m')
    expect(`${english.copy.intro}${english.copy.arrival}`).not.toContain(
      'sixteen and a half',
    )
  })

  it('keeps the mammoth invitation simple, warm and child-facing', () => {
    const zh = scaleEncounterContentFor('mammoth', 'zh-CN')
    const english = scaleEncounterContentFor('mammoth', 'en')

    expect(zh.copy.measurement).toContain('肩膀离地约 3–3.5 米')
    expect(zh.copy.intro).not.toMatch(/防寒外套|手套|雪裤|雪地靴/)
    expect(zh.copy.intro).toContain('冰河时代')
    expect(zh.copy.intro).toContain('寻找猛犸象')
    expect(zh.copy.intro).not.toMatch(/模型|幼年|成年|暂时|展示/)
    expect(zh.copy.transition).toContain('厚外套')
    expect(zh.copy.transition).toContain('手套')
    expect(zh.copy.transition).toContain('雪裤')
    expect(zh.copy.transition).toContain('雪地靴')
    expect(zh.copy.arrival).toContain('抬头看')
    expect(zh.copy.arrival).toContain('弯弯的象牙')
    expect(zh.copy.arrival).not.toMatch(/绕到|来到.*眼睛|机位|相机/)
    expect(english.copy.measurement).toContain('Shoulders')
    expect(english.copy.intro).not.toMatch(/model|listing|baby|enlarge/i)
    expect(english.copy.transition).toContain('thick coats')
    expect(english.copy.transition).toContain('snow trousers')
  })

  it('describes the Pteranodon encounter without hard-coding one of its two viewpoints into the scene label', () => {
    const content = scaleEncounterContentFor('pteranodon', 'zh-CN')

    expect(content.sceneLabel).toBe('空中相遇')
    expect(content.sceneLabel).not.toContain('小朋友眼睛视角')
    expect(content.copy.intro).toContain('飞行装备')
    expect(content.copy.transition).toContain('手臂张开')
    expect(content.copy.transition).toContain('小飞鸟')
    expect(content.copy.transition).not.toMatch(/后上方|来到.*眼睛/)
    expect(content.copy.arrival).toContain('对面')
    expect(content.copy.arrival).toContain('七米')
    expect(`${content.copy.intro}${content.copy.transition}${content.copy.arrival}`)
      .not.toMatch(/低头|下面|俯视/)
  })

  it('keeps the underwater directions and visible anatomy aligned', () => {
    const content = scaleEncounterContentFor('mosasaurus', 'zh-CN')

    expect(content.copy.intro).toContain('白垩纪的海洋')
    expect(content.copy.intro).toContain('寻找沧龙')
    expect(content.copy.intro).toContain('潜水装备')
    expect(content.copy.transition).toContain('面镜')
    expect(content.copy.transition).toContain('气瓶')
    expect(content.copy.transition).toContain('脚蹼')
    expect(content.copy.transition).toContain('水面')
    expect(content.copy.transition).not.toMatch(/右边|身后|来到.*眼睛/)
    expect(content.copy.arrival).toContain('斜上方')
    expect(content.copy.arrival).toContain('肚子')
    expect(content.copy.arrival).toContain('四只鳍')
    expect(content.copy.arrival).toContain('尾巴')
    expect(content.copy.arrival).toContain('十二米')
  })

  it('keeps every guided phase as an independently addressable narration slice', () => {
    for (const locale of ['zh-CN', 'en'] as const) {
      for (const animal of [
        ...SCALE_ENCOUNTER_ANIMAL_IDS,
      ]) {
        const { audio } = scaleEncounterContentFor(animal, locale)
        expect(audio.intro).toMatch(
          new RegExp(`intro(?:-v\\d+)?\\.${locale}\\.mp3$`),
        )
        expect(audio.transition).toMatch(
          new RegExp(`transition(?:-v\\d+)?\\.${locale}\\.mp3$`),
        )
        expect(audio.arrival).toMatch(
          new RegExp(`arrival(?:-v\\d+)?\\.${locale}\\.mp3$`),
        )
        expect(audio.toChildEyes).toMatch(
          new RegExp(`view-switch-to-eyes(?:-v\\d+)?\\.${locale}\\.mp3$`),
        )
        expect(audio.toChildRear).toMatch(
          new RegExp(`view-switch-to-rear(?:-v\\d+)?\\.${locale}\\.mp3$`),
        )
      }
    }
  })

  it('uses one exploration voice without exposing models or scientific caveats', () => {
    const ichthyosaur = scaleEncounterContentFor('ichthyosaur', 'zh-CN')
    const plesiosaur = scaleEncounterContentFor('plesiosaurus', 'zh-CN')
    const meganeura = scaleEncounterContentFor('meganeura', 'zh-CN')

    for (const animalId of SCALE_ENCOUNTER_ANIMAL_IDS) {
      const content = scaleEncounterContentFor(animalId, 'zh-CN')
      const narration = `${content.copy.intro}${content.copy.transition}${content.copy.arrival}`
      expect(content.copy.intro).toContain('寻找')
      expect(narration).not.toMatch(/模型|展示|复原|估算|不确定|只作|类/)
      // The Megalodon line deliberately uses the unambiguous comparative
      // phrase requested for the bus comparison. Other scripts retain the
      // existing guard against polyphonic uses that previously confused TTS.
      if (animalId === 'megalodon') {
        expect(content.copy.arrival).toContain('比一辆大巴还要长')
      } else {
        expect(narration).not.toContain('长')
      }
    }
    expect(ichthyosaur.copy.intro).toContain('寻找鱼龙')
    expect(ichthyosaur.copy.intro).not.toContain('鱼龙类')
    expect(plesiosaur.copy.intro).toContain('寻找蛇颈龙')
    expect(plesiosaur.copy.intro).not.toContain('蛇颈龙类')
    expect(plesiosaur.copy.transition).toContain('我们轻轻摆动脚蹼')
    expect(plesiosaur.copy.transition).toContain('蛇颈龙正从对面游来')
    expect(meganeura.sceneLabel).toBe('森林相遇')
    expect(meganeura.copy.arrival).toContain('七十厘米')
  })

  it('keeps the three restored land encounters aligned with their forest narration', () => {
    for (const animalId of [
      'gigantoraptor',
      'dilophosaurus',
      'meganeura',
    ] as const) {
      const zh = scaleEncounterContentFor(animalId, 'zh-CN')
      const english = scaleEncounterContentFor(animalId, 'en')

      expect(zh.sceneLabel).toBe('森林相遇')
      expect(zh.copy.intro).toMatch(/森林/)
      expect(english.sceneLabel).toBe('Forest encounter')
      expect(english.copy.intro).toMatch(/forest/i)
    }
  })

  it('keeps the English narration on the same child-first exploration path', () => {
    for (const animalId of SCALE_ENCOUNTER_ANIMAL_IDS) {
      const content = scaleEncounterContentFor(animalId, 'en')
      const narration = `${content.copy.intro}${content.copy.transition}${content.copy.arrival}`
      expect(content.copy.intro).toMatch(/search|searching/i)
      expect(narration).not.toMatch(/model|display|reconstruct|estimate|uncertain/i)
    }
  })

  it('describes viewpoint size as appearance rather than a physical change', () => {
    const content = scaleEncounterContentFor('stegosaurus', 'zh-CN')
    expect(content.copy.toChildEyes).toContain('显得更大了')
    expect(content.copy.toChildEyes).not.toContain('是不是更大了')
  })
})
