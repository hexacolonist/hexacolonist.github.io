import { initPWA } from './pwa.ts'
import render, { RenderState } from './renderer'
import edit from './editor'

enum Angle {
  Right = 0,
  UpRight = Math.PI / 6,
  Up = Math.PI / 2,
  UpLeft = (Math.PI * 5) / 6,
  Left = Math.PI,
  DownLeft = (Math.PI * 7) / 6,
  Down = (Math.PI * 3) / 2,
  DownRight = (Math.PI * 11) / 6
}

setTimeout(() => {
  const view: RenderState = {
    x: 0,
    y: 0,
    radius: 5,
    angle: Angle.UpRight,
    objects: [
      {
        x: 0,
        y: 0,
        color: [1, 1, 1],
        angle: Angle.UpRight
      }
    ],
    running: true
  }
  registerCanvas(view)

  registerEditor()

  const loading = document.getElementById('loading')!
  loading.classList.add('hiding')
  setTimeout(() => loading.remove(), 5000)
})

const ANGLE_KEYS: Partial<Record<string, Angle>> = {
  ArrowRight: Angle.Right,
  ArrowUp: Angle.Up,
  ArrowDown: Angle.Down,
  ArrowLeft: Angle.Left,
  KeyE: Angle.UpRight,
  KeyW: Angle.Up,
  KeyQ: Angle.UpLeft,
  KeyA: Angle.DownLeft,
  KeyS: Angle.Down,
  KeyD: Angle.DownRight
}
function registerCanvas(view: RenderState) {
  /** pixel / ms */
  const speed = 0.5
  const keyCodesDown = new Set<string>()
  function update(delta: number) {
    let x = 0,
      y = 0
    for (const key of keyCodesDown) {
      const angle = ANGLE_KEYS[key]
      if (angle !== undefined) {
        x += Math.cos(angle)
        y += Math.sin(angle)
      }
    }
    const epsilon = 0.0001
    if (Math.abs(x) > epsilon || Math.abs(y) > epsilon) {
      const moveAngle = Math.atan2(y, x)
      view.x += Math.cos(moveAngle) * delta * speed
      view.y += Math.sin(moveAngle) * delta * speed
    }
  }

  const canvas = document.getElementById('canvas') as HTMLCanvasElement
  render(canvas, view, update)

  const body = document.body
  /*const overlay = document.querySelector<HTMLDivElement>('#overlay')!
  body.addEventListener('click', (e) => {
    if (e.target === overlay) // canvas clicked
  })*/
  body.addEventListener('keydown', (e) => {
    if (e.target === body) keyCodesDown.add(e.code)
  })
  body.addEventListener('keyup', (e) => {
    keyCodesDown.delete(e.code)
  })
  window.addEventListener('blur', (e) => {
    if (e.target === window) keyCodesDown.clear()
  })
  window.addEventListener('wheel', (e) => {
    let speed = 1
    if (e.deltaMode) speed *= 10
    if (e.altKey) speed *= 10

    //TODO: rotate around mouse or at least center
    view.radius += e.deltaY * speed * 0.01
    view.radius = Math.max(0, view.radius)

    view.angle += e.deltaX * speed * 0.001
  })
}

function registerEditor() {
  let getEditor = () => {
    const editor = document.getElementById('editor')!
    getEditor = () => editor
    editor.classList.add('loading')
    edit(editor)
      .catch((err) => {
        console.error('Failed to load editor', err)
        editor.innerText = 'Failed to load editor'
      })
      .finally(() => editor.classList.remove('loading'))
    return null as HTMLElement | null
  }

  const editorHandle = document.getElementById('resize-handle')!
  editorHandle.addEventListener('mousedown', (e) => {
    e.preventDefault()
    const editor = getEditor()
    if (!editor) return
    const offset = editor.offsetWidth + e.clientX
    const onMouseMove = (e: MouseEvent) => {
      let width = offset - e.clientX
      if (width < 10) width = 0
      editor.style.width = `${width}px`
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  })
  editorHandle.addEventListener('dblclick', () => {
    const editor = getEditor()
    if (editor) editor.style.width = editor.style.width === '0px' ? '50%' : '0px'
  })
}

initPWA()
