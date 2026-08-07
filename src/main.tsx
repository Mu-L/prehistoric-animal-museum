import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fredoka'
import '@fontsource-variable/noto-sans-sc'
import '@fontsource-variable/nunito'
import '@fontsource/zcool-kuaile'
import { App } from './App'
import { readInitialLocaleState } from './i18n/browser-locale'
import './styles.css'

const initialLocale = readInitialLocaleState().locale
document.documentElement.lang = initialLocale
document.documentElement.dataset.locale = initialLocale

const root = document.getElementById('root')

if (!root) {
  throw new Error('应用挂载点不存在。')
}

// The production document contains a crawlable no-JavaScript SEO shell.
// Remove it as soon as the client starts so the root x-default copy cannot
// flash before the system-resolved interface is committed.
root.replaceChildren()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
