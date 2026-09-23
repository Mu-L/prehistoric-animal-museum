/** Short observation prompts with an evidence caveat for companion flight. */
export const observationCards = {
 'zh-CN': [
  {id:'glitter',title:'水面为什么会闪光？',body:'看看水面上的亮点。小波浪换了角度，照向我们眼睛的阳光也跟着变了。',parent:'水面把阳光反射向观察者。波面不断改变朝向，许多细小的反光组成闪烁的光带。可以换个机位比较。',source:'NASA · The Science of Sunglint',url:'https://science.nasa.gov/earth/earth-observatory/the-science-of-sunglint-84333/'},
  {id:'shadows',title:'云影走到哪里了？',body:'找找地上较暗的地方，再看看天上的云。云慢慢移动，挡住阳光的位置也跟着移动。',parent:'云挡住阳光时，地上会出现阴影。太阳和云的位置一变，阴影也会跟着移动。',source:'观察提示',url:null},
  {id:'company',title:'一起飞一小段',body:'远处也有无齿翼龙。看看它们的翅膀，是同时拍动的吗？',parent:'画面里安排同伴一起飞，是为了方便观察翅膀动作。我们还不能据此判断无齿翼龙是否真的结伴飞行，也没有为它们添加想象的叫声。',source:'观察提示',url:null},
 ],
 en: [
  {id:'glitter',title:'Why does water sparkle?',body:'Look for the bright spots. As little waves tilt, the sunlight reaching our eyes changes too.',parent:'Sunlight reflects from the water toward the observer. Changing wave angles create many small glints. Compare another viewpoint.',source:'NASA · The Science of Sunglint',url:'https://science.nasa.gov/earth/earth-observatory/the-science-of-sunglint-84333/'},
  {id:'shadows',title:'Where did the cloud shadow go?',body:'Find a darker patch below, then look at the clouds. As a cloud moves, the sunlight it blocks moves too.',parent:'A cloud casts a shadow when it blocks sunlight. As the Sun and the cloud move, so does the shadow.',source:'Observation tip',url:null},
  {id:'company',title:'Fly together for a little while',body:'There are other Pteranodon in the distance. Do their wings beat at the same time?',parent:'The companions help us compare wing movements. Their appearance here does not tell us whether Pteranodon actually flew in groups. We have not added imagined animal calls.',source:'Observation tip',url:null},
 ],
} as const
