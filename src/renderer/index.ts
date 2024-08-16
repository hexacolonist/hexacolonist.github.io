import { RenderState, vec4 } from './types'
import { setupWebGl, Mat3 } from './webgl'
export type { RenderState } from './types'

export default function makeRenderer(
  canvas: HTMLCanvasElement,
  state: RenderState,
  onUpdate: (deltaMs: number) => void = () => {}
) {
  const gl = setupWebGl(canvas)

  let lastTime = 0
  /** Hot render loop. Should allocate as lite as possible */
  function loop(time: number) {
    if (!state.running) return

    const delta = time - (lastTime || time)
    lastTime = time
    onUpdate(delta)

    if (resizeCanvasToPixel(canvas)) gl.resize()
    gl.clear()

    const min = Math.min(canvas.width, canvas.height)
    const scale = 2 + 3 * (state.radius || 0)
    gl.drawGrid(
      new Mat3()
        .identity()
        .translate(state.x - canvas.width / 2, state.y - canvas.height / 2)
        .scale(scale / min)
        .rotate(state.angle)
    )

    gl.drawObjects((add) => {
      const m = new Mat3()
      const c: vec4 = [0, 0, 0, 1]
      for (const { x, y, angle, color } of state.objects) {
        c[0] = color[0]
        c[1] = color[1]
        c[2] = color[2]
        m.identity()
          .rotate(angle)
          .translate(x, y)
          .rotate(-state.angle)
          .scale(min / canvas.width / scale, min / canvas.height / scale)
          .translate(-state.x / (canvas.width / 2), -state.y / (canvas.height / 2))
        add(m, c)
      }
    })

    window.requestAnimationFrame(loop)
  }
  window.requestAnimationFrame(loop)
}

function resizeCanvasToPixel(c: HTMLCanvasElement, multiplier = window.devicePixelRatio) {
  const width = (c.clientWidth * multiplier) | 0
  const height = (c.clientHeight * multiplier) | 0
  if (c.width !== width || c.height !== height) {
    c.width = width
    c.height = height
    return true
  }
  return false
}
