import { ArrowRight, Check, Image as ImageIcon, Link2, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Locale } from '../i18n/locale'
import { museumOfficialUrl } from '../official-links'
import './share-dialog.css'

interface ShareAnimal {
  id: string
  name: string
  intro: string
  backgroundPortrait: string
  posterPortrait: string
}

interface ShareDialogProps {
  animal: ShareAnimal
  locale: Locale
  onClose: () => void
  returnFocusTo: RefObject<HTMLElement | null>
}

const focusableSelector = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  let line = ''
  let lines = 0
  for (const character of value) {
    if (context.measureText(line + character).width > maxWidth && line) {
      context.fillText(line, x, y + lines * lineHeight)
      lines += 1
      line = character
      if (lines >= maxLines) return
    } else {
      line += character
    }
  }
  if (line && lines < maxLines) context.fillText(line, x, y + lines * lineHeight)
}

async function createCardFile(animal: ShareAnimal, locale: Locale): Promise<File> {
  const [background, poster] = await Promise.all([
    loadImage(animal.backgroundPortrait),
    loadImage(animal.posterPortrait),
  ])
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas unavailable')

  // The portrait layers use one coordinate space so the animal meets the ground.
  context.drawImage(background, 0, 0, 1080, 1920)
  const posterWidth = poster.naturalWidth / poster.naturalHeight * 1920
  context.drawImage(poster, (1080 - posterWidth) / 2, 0, posterWidth, 1920)

  const shade = context.createLinearGradient(0, 1420, 0, 1920)
  shade.addColorStop(0, 'rgba(17, 39, 30, 0)')
  shade.addColorStop(0.55, 'rgba(17, 39, 30, .73)')
  shade.addColorStop(1, 'rgba(17, 39, 30, .92)')
  context.fillStyle = shade
  context.fillRect(0, 1370, 1080, 550)
  context.fillStyle = '#fff9e9'
  context.font = '700 37px sans-serif'
  context.fillText(locale === 'zh-CN' ? '史前动物博物馆' : 'Prehistoric Animal Museum', 80, 1520)
  context.font = '800 112px sans-serif'
  context.fillText(animal.name, 76, 1660)
  context.font = '500 38px sans-serif'
  drawWrappedText(context, animal.intro, 80, 1735, 900, 52, 2)
  context.font = '600 30px sans-serif'
  context.fillText(locale === 'zh-CN' ? 'Leon做了个' : 'Leon Made This', 80, 1870)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Image export failed')), 'image/png')
  })
  return new File([blob], `${animal.id}-museum-card.png`, { type: 'image/png' })
}

function downloadCard(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function copyWithSelection(value: string): boolean {
  const field = document.createElement('textarea')
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const selection = window.getSelection()
  const previousRanges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : []
  field.value = value
  field.readOnly = true
  field.style.position = 'fixed'
  field.style.left = '0'
  field.style.top = '0'
  field.style.width = '1px'
  field.style.height = '1px'
  field.style.opacity = '0'
  field.style.pointerEvents = 'none'
  document.body.appendChild(field)
  try {
    field.focus({ preventScroll: true })
    field.select()
    field.setSelectionRange(0, field.value.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
    if (selection) {
      selection.removeAllRanges()
      previousRanges.forEach((range) => selection.addRange(range))
    }
    previousFocus?.focus({ preventScroll: true })
  }
}

function canShareImage(file: File | null): boolean {
  if (!file || !window.isSecureContext || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

function ShareArt({ animal, locale }: { animal: ShareAnimal; locale: Locale }) {
  return (
    <div className="share-dialog-art" role="img" aria-label={locale === 'zh-CN' ? `${animal.name}分享卡片预览` : `${animal.name} share card preview`}>
      <img className="share-dialog-art__background" src={animal.backgroundPortrait} alt="" />
      <img className="share-dialog-art__animal" src={animal.posterPortrait} alt="" />
      <span className="share-dialog-art__top">{locale === 'zh-CN' ? '史前动物博物馆' : 'Prehistoric Animal Museum'}</span>
      <span className="share-dialog-art__caption">
        <strong>{animal.name}</strong>
        <span>{animal.intro}</span>
        <small>{locale === 'zh-CN' ? 'Leon做了个' : 'Leon Made This'}</small>
      </span>
    </div>
  )
}

function AuthorLinks({ locale }: { locale: Locale }) {
  const zh = locale === 'zh-CN'
  return (
    <div className="share-dialog-author">
      <div className="share-dialog-author__identity">
        <span className="share-dialog-author__label">{zh ? '作者' : 'Created by'}</span>
        <strong>{zh ? 'Leon做了个' : 'Leon Made This'}</strong>
        <small>{zh ? 'Leon Made This' : 'Leon做了个'}</small>
      </div>
      <nav aria-label={zh ? '作者的社交账号' : 'Creator profiles'} className="share-dialog-author__links">
        <a href="https://x.com/leon_made_this" rel="noopener noreferrer" target="_blank">X</a>
        <a href="https://www.xiaohongshu.com/user/profile/64c2957b000000001403adfb" rel="noopener noreferrer" target="_blank">{zh ? '小红书' : 'rednote'}</a>
        <a href="https://www.threads.com/@leon_made_this" rel="noopener noreferrer" target="_blank">Threads</a>
      </nav>
    </div>
  )
}

function ShareAction({
  animal,
  detail,
  href,
  mark,
  onClick,
  title,
}: {
  animal?: ShareAnimal
  detail: string
  href?: string
  mark: 'x' | 'threads' | 'image' | 'link'
  onClick?: () => void
  title: string
}) {
  const className = `share-dialog-action${animal ? ' share-dialog-action--image' : ''}`
  const contents = <>
    {animal ? (
      <span aria-hidden="true" className="share-dialog-action__thumbnail">
        <img src={animal.backgroundPortrait} alt="" />
        <img src={animal.posterPortrait} alt="" />
      </span>
    ) : (
      <span aria-hidden="true" className={`share-dialog-action__mark share-dialog-action__mark--${mark}`}>
        {mark === 'x' ? '𝕏' : mark === 'threads' ? '@' : mark === 'image' ? <ImageIcon size={19} /> : <Link2 size={19} />}
      </span>
    )}
    <span className="share-dialog-action__copy"><strong>{title}</strong><small>{detail}</small></span>
    <ArrowRight aria-hidden="true" size={18} />
  </>
  if (href) return <a className={className} href={href} rel="noopener noreferrer" target="_blank">{contents}</a>
  return <button className={className} onClick={onClick} type="button">{contents}</button>
}

export default function ShareDialog({ animal, locale, onClose, returnFocusTo }: ShareDialogProps) {
  const zh = locale === 'zh-CN'
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [notice, setNotice] = useState('')
  const [manualCopyValue, setManualCopyValue] = useState<string | null>(null)
  const [cardData, setCardData] = useState<{ key: string; file: File } | null>(null)
  const cardAnimal = useMemo<ShareAnimal>(() => ({
    id: animal.id,
    name: animal.name,
    intro: animal.intro,
    backgroundPortrait: animal.backgroundPortrait,
    posterPortrait: animal.posterPortrait,
  }), [animal.id, animal.name, animal.intro, animal.backgroundPortrait, animal.posterPortrait])
  const cardKey = [cardAnimal.id, cardAnimal.name, cardAnimal.intro, cardAnimal.backgroundPortrait, cardAnimal.posterPortrait, locale].join('\u0000')
  const cardFile = cardData?.key === cardKey ? cardData.file : null
  const shareableImage = canShareImage(cardFile)
  const exhibitUrl = new URL(`animals/${animal.id}/`, museumOfficialUrl(locale)).toString()
  const intentText = `${zh ? `今天在史前动物博物馆遇见${animal.name}。${animal.intro}` : `Meet ${animal.name} at the Prehistoric Animal Museum. ${animal.intro}`} @leon_made_this`
  const xIntentUrl = `https://twitter.com/intent/tweet?${new URLSearchParams({ text: intentText, url: exhibitUrl })}`
  const threadsIntentUrl = `https://www.threads.com/intent/post?${new URLSearchParams({ text: intentText, url: exhibitUrl })}`

  useEffect(() => {
    let active = true
    void createCardFile(cardAnimal, locale).then((file) => {
      if (active) setCardData({ key: cardKey, file })
    }).catch(() => {})
    return () => { active = false }
  }, [cardAnimal, cardKey, locale])

  useEffect(() => {
    const returnTarget = returnFocusTo.current
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const controls = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector))
      const first = controls[0]
      const last = controls.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      returnTarget?.focus()
    }
  }, [onClose, returnFocusTo])

  const copyLink = async () => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(exhibitUrl)
        setManualCopyValue(null)
        setNotice(zh ? '展项链接已复制' : 'Exhibit link copied')
        return
      } catch {
        // A browser can reject a clipboard write even on HTTPS.
      }
    }
    if (copyWithSelection(exhibitUrl)) {
      setManualCopyValue(null)
      setNotice(zh ? '展项链接已复制' : 'Exhibit link copied')
      return
    }
    setManualCopyValue(exhibitUrl)
    setNotice(zh ? '请长按下方链接复制' : 'Press and hold the link below to copy it')
  }

  const saveImage = async () => {
    try {
      downloadCard(cardFile ?? await createCardFile(cardAnimal, locale))
      setNotice(zh ? '图片已保存到下载文件夹' : 'Image saved to downloads')
    } catch {
      setNotice(zh ? '图片暂时无法保存' : 'Could not save image')
    }
  }

  const shareImage = async () => {
    if (!cardFile || !canShareImage(cardFile)) {
      await saveImage()
      return
    }
    try {
      await navigator.share({ files: [cardFile], title: `${animal.name} · ${zh ? '史前动物博物馆' : 'Prehistoric Animal Museum'}` })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      await saveImage()
    }
  }

  return (
    <div className="share-dialog-layer">
      <button aria-label={zh ? '关闭分享' : 'Close sharing'} className="share-dialog-backdrop" onClick={onClose} type="button" />
      <section aria-labelledby={titleId} aria-modal="true" className="share-dialog-panel" ref={panelRef} role="dialog">
        <header className="share-dialog-header">
          <div>
            <span className="share-dialog-eyebrow">{zh ? '史前动物博物馆' : 'Prehistoric Animal Museum'} · {animal.name}</span>
            <h2 id={titleId}>{zh ? '分享这次发现' : 'Share this discovery'}</h2>
          </div>
          <button aria-label={zh ? '关闭' : 'Close'} className="share-dialog-close" onClick={onClose} ref={closeRef} type="button"><X size={22} /></button>
        </header>
        <div className="share-dialog-scroll">
          <div className="share-dialog-content">
            <p className="share-dialog-intro">{zh ? '把展项链接发到 X 或 Threads，也可以分享这张竖图。' : 'Post the exhibit link to X or Threads, or share this portrait image.'}</p>
            <div className="share-dialog-actions">
              <ShareAction mark="x" title={zh ? '发到 X' : 'Post on X'} detail={zh ? '文字和展项链接已填好' : 'Text and exhibit link are ready'} href={xIntentUrl} />
              <ShareAction mark="threads" title={zh ? '发到 Threads' : 'Post on Threads'} detail={zh ? '文字和展项链接已填好' : 'Text and exhibit link are ready'} href={threadsIntentUrl} />
              <ShareAction animal={animal} mark="image" title={shareableImage ? (zh ? '分享图片' : 'Share image') : (zh ? '保存图片' : 'Save image')} detail={shareableImage ? (zh ? '打开系统分享列表' : 'Open the device share sheet') : (zh ? '下载竖版卡片' : 'Download the portrait card')} onClick={() => { void (shareableImage ? shareImage() : saveImage()) }} />
              <ShareAction mark="link" title={zh ? '复制展项链接' : 'Copy exhibit link'} detail={zh ? '发给朋友继续参观' : 'Send a friend to the exhibit'} onClick={() => { void copyLink() }} />
            </div>
            <div className="share-dialog-preview"><ShareArt animal={animal} locale={locale} /></div>
            <AuthorLinks locale={locale} />
          </div>
          {notice ? <p aria-live="polite" className="share-dialog-notice"><Check size={16} />{notice}</p> : null}
          {manualCopyValue ? <input aria-label={zh ? '可手动复制的链接' : 'Link to copy manually'} className="share-dialog-manual-copy" onFocus={(event) => event.currentTarget.select()} readOnly value={manualCopyValue} /> : null}
        </div>
      </section>
    </div>
  )
}
