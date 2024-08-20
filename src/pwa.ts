import { registerSW } from 'virtual:pwa-register'
import { getAlert } from './alert'

export function initPWA() {
  let refreshSW: (reloadPage?: boolean) => Promise<void> | undefined
  const refreshCallback = () => refreshSW?.(true)

  window.addEventListener('load', () => {
    refreshSW = registerSW({
      immediate: true,
      onOfflineReady() {
        getAlert().show('Game is ready to work offline')
      },
      onNeedRefresh() {
        getAlert().show('New content available, click on reload button to update', refreshCallback)
      }
    })
  })
}
