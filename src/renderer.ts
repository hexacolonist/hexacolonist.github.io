import passthroughVertexShader from './glsl/passthrough.vs'
import hexFragmentShader from './glsl/hex.fs'

export interface RenderState {
  /** pixel */
  x: number
  /** pixel */
  y: number
  /** hexagon */
  radius: number
  /** radian */
  angle: number
  running: boolean
}
export default function render(
  canvas: HTMLCanvasElement,
  state: RenderState,
  onUpdate: (deltaMs: number) => void = () => {}
) {
  const gl = canvas.getContext('webgl2')!
  if (!gl) throw new Error('webgl2 not supported')

  const program = compileProgram(gl, passthroughVertexShader, hexFragmentShader)
  gl.useProgram(program)

  const triangleBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 3, -1, -1, 3, -1]), gl.STATIC_DRAW)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(0)

  const transformLoc = gl.getUniformLocation(program, 'transform')!

  let lastTime = 0
  function loop(time: number) {
    if (!state.running) return

    const delta = time - (lastTime || time)
    lastTime = time
    onUpdate(delta)

    if (resizeCanvasToPixel(canvas)) {
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    const scale = (2 + 3 * (state.radius || 0)) / Math.min(canvas.width, canvas.height)
    gl.uniformMatrix3fv(
      transformLoc,
      false,
      Mat3.translate(state.x - canvas.width / 2, state.y - canvas.height / 2)
        .multiply(Mat3.scale(scale, scale))
        .multiply(Mat3.rotate(state.angle))
    )

    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.drawArrays(gl.TRIANGLES, 0, 3)

    window.requestAnimationFrame(loop)
  }
  window.requestAnimationFrame(loop)
}

function compileProgram(gl: WebGL2RenderingContext, vertexShader: string, fragmentShader: string) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexShader)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader)

  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  const success = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean
  if (success) return program

  const error = gl.getProgramInfoLog(program)
  gl.deleteProgram(program)
  gl.deleteShader(fs)
  gl.deleteShader(vs)
  throw new Error(error ?? 'failed to link program')
}

function compileShader(gl: WebGL2RenderingContext, type: GLenum, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean
  if (success) return shader

  const error = gl.getShaderInfoLog(shader)
  gl.deleteShader(shader)
  throw new Error(error ?? 'failed to compile shader')
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

class Mat3 extends Float32Array {
  constructor() {
    super(9)
    this.fill(0)
    this[0] = this[4] = this[8] = 1
  }
  static scale(x: number, y: number) {
    const m = new Mat3()
    m[0] = x
    m[4] = y
    return m
  }
  static translate(x: number, y: number) {
    const m = new Mat3()
    m[6] = x
    m[7] = y
    return m
  }
  static rotate(rad: number) {
    const c = Math.cos(rad)
    const s = Math.sin(rad)

    const m = new Mat3()
    m[0] = c
    m[1] = s
    m[3] = -s
    m[4] = c
    return m
  }
  multiply(m: Mat3) {
    const a00 = this[0],
      a01 = this[1],
      a02 = this[2]
    const a10 = this[3],
      a11 = this[4],
      a12 = this[5]
    const a20 = this[6],
      a21 = this[7],
      a22 = this[8]

    const b00 = m[0],
      b01 = m[1],
      b02 = m[2]
    const b10 = m[3],
      b11 = m[4],
      b12 = m[5]
    const b20 = m[6],
      b21 = m[7],
      b22 = m[8]

    this[0] = a00 * b00 + a01 * b10 + a02 * b20
    this[1] = a00 * b01 + a01 * b11 + a02 * b21
    this[2] = a00 * b02 + a01 * b12 + a02 * b22
    this[3] = a10 * b00 + a11 * b10 + a12 * b20
    this[4] = a10 * b01 + a11 * b11 + a12 * b21
    this[5] = a10 * b02 + a11 * b12 + a12 * b22
    this[6] = a20 * b00 + a21 * b10 + a22 * b20
    this[7] = a20 * b01 + a21 * b11 + a22 * b21
    this[8] = a20 * b02 + a21 * b12 + a22 * b22
    return this
  }
}
