import { initPWA } from './pwa.ts'
import render, { RenderState } from './renderer.ts'

setTimeout(() => {
  //const overlay = document.querySelector<HTMLDivElement>('#overlay')!

  const view: RenderState = {
    offset: [0, 0],
    scale: [100, 100],
  }
  const speed = 20
  render(document.querySelector<HTMLCanvasElement>('#canvas')!, view)

  const keysDown = new Set<string>()
  window.addEventListener('keyup', (e) => keysDown.delete(e.key))
  window.addEventListener('keydown', (e) => {
    keysDown.add(e.key)
    for (const key of keysDown) {
      switch (key) {
        case 'ArrowUp':
          view.offset[1] += speed
          break
        case 'ArrowDown':
          view.offset[1] -= speed
          break
        case 'ArrowLeft':
          view.offset[0] -= speed
          break
        case 'ArrowRight':
          view.offset[0] += speed
          break
      }
    }
  })

  const loading = document.querySelector<HTMLDivElement>('#loading')!
  loading.classList.add('hiding')
  setTimeout(() => loading.remove(), 5000)
})

initPWA()
