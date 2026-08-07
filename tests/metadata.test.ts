import { updateLocalizedMetadata } from '../src/i18n/metadata'

describe('runtime locale metadata', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <link rel="alternate" hreflang="x-default" href="https://leon-made-this.work/museum/" />
      <link rel="alternate" hreflang="zh-CN" href="https://leon-made-this.work/museum/zh-CN/" />
      <link rel="alternate" hreflang="en" href="https://leon-made-this.work/museum/en/" />
      <link rel="canonical" href="https://leon-made-this.work/museum/zh-CN/" />
      <meta name="description" content="旧说明" />
      <meta property="og:title" content="旧标题" />
      <meta property="og:url" content="https://leon-made-this.work/museum/zh-CN/" />
      <meta property="og:image" content="https://leon-made-this.work/museum/social/museum.zh-CN.svg" />
      <meta property="og:locale" content="zh_CN" />
      <meta name="twitter:title" content="旧标题" />
    `
    window.history.replaceState(
      {},
      '',
      '/museum/en/?animal=stegosaurus#viewer',
    )
  })

  it('updates every locale-sensitive canonical and social field after a smooth switch', () => {
    updateLocalizedMetadata({
      locale: 'en',
      documentTitle: 'Prehistoric Animal Museum | A 3D Family Adventure',
      museumTitle: 'Prehistoric Animal Museum',
      creatorBrand: 'Leon Made This',
      description: 'Explore 18 prehistoric animals.',
      socialImageAlt: 'Prehistoric Animal Museum by Leon Made This',
    })

    expect(document.title).toBe(
      'Prehistoric Animal Museum | A 3D Family Adventure',
    )
    expect(
      document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
    ).toBe('https://leon-made-this.work/museum/en/')
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="description"]')
        ?.content,
    ).toBe('Explore 18 prehistoric animals.')
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
        ?.content,
    ).toBe('https://leon-made-this.work/museum/en/')
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:locale"]')
        ?.content,
    ).toBe('en_GB')
    expect(
      document.querySelector<HTMLMetaElement>(
        'meta[property="og:locale:alternate"]',
      )?.content,
    ).toBe('zh_CN')
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')
        ?.content,
    ).toBe('Leon Made This')
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:image"]')
        ?.content,
    ).toBe(
      'https://leon-made-this.work/museum/social/museum.en.png',
    )
    expect(
      document.querySelector<HTMLMetaElement>(
        'meta[property="og:image:type"]',
      )?.content,
    ).toBe('image/png')
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:image:alt"]')
        ?.content,
    ).toBe('Prehistoric Animal Museum by Leon Made This')
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')
        ?.content,
    ).toBe('Prehistoric Animal Museum')
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="twitter:card"]')
        ?.content,
    ).toBe('summary_large_image')
    expect(
      document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')
        ?.content,
    ).toBe(
      'https://leon-made-this.work/museum/social/museum.en.png',
    )
  })

  it('does not put animal state, query parameters, or fragments in a canonical URL', () => {
    document
      .querySelectorAll('link[rel="alternate"]')
      .forEach((link) => link.remove())

    updateLocalizedMetadata({
      locale: 'en',
      documentTitle: 'Museum',
      museumTitle: 'Museum',
      creatorBrand: 'Brand',
      description: 'Description',
      socialImageAlt: 'Museum card',
    })

    expect(
      document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
    ).toBe('http://localhost:3000/museum/en/')
  })

  it('keeps the system-resolving root canonical and social card on x-default', () => {
    window.history.replaceState(
      {},
      '',
      '/museum/?animal=stegosaurus#viewer',
    )

    updateLocalizedMetadata({
      locale: 'zh-CN',
      documentTitle: '史前动物博物馆 | 亲子 3D 史前动物展',
      museumTitle: '史前动物博物馆',
      creatorBrand: 'Leon做了个',
      description: '说明',
      socialImageAlt: '双语分享卡片',
    })

    expect(
      document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
    ).toBe('https://leon-made-this.work/museum/')
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
        ?.content,
    ).toBe('https://leon-made-this.work/museum/')
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:image"]')
        ?.content,
    ).toBe('https://leon-made-this.work/museum/social/museum.png')
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:locale"]')
        ?.content,
    ).toBe('zh_CN')
    expect(
      document.querySelector<HTMLMetaElement>(
        'meta[property="og:locale:alternate"]',
      )?.content,
    ).toBe('en_GB')
  })
})
