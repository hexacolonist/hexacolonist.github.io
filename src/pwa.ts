import { registerSW } from 'virtual:pwa-register'
import { getAlert } from './alert'

export function initPWA() {
    const alert = getAlert()

    let refreshSW: (reloadPage?: boolean) => Promise<void> | undefined
    const refreshCallback = () => refreshSW?.(true)

    window.addEventListener('load', () => {
        refreshSW = registerSW({
            immediate: true,
            onOfflineReady() {
                alert.show('Game is ready to work offline')
            },
            onNeedRefresh() {
                alert.show('New content available, click on reload button to update', refreshCallback)
            },
        })
    })
}
