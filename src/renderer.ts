import passthroughVertexShader from './glsl/passthrough.vs'
import hexFragmentShader from './glsl/hex.fs'
import objectVertexShader from './glsl/object.vs'
import objectFragmentShader from './glsl/object.fs'

export interface RenderState {
  /** pixel */
  x: number
  /** pixel */
  y: number
  /** hexagon */
  radius: number
  /** radian */
  angle: number
  objects: RenderObject[]
  running: boolean
}
interface RenderObject {
  /** not pixel */
  x: number
  /** not pixel */
  y: number
  color: vec3
  angle: number
}

export default function render(
  canvas: HTMLCanvasElement,
  state: RenderState,
  onUpdate: (deltaMs: number) => void = () => {}
) {
  const gl = canvas.getContext('webgl2')!
  if (!gl) throw new Error('webgl2 not supported')

  const drawGrid = (() => {
    const program = compileProgram(gl, passthroughVertexShader, hexFragmentShader)
    const setTransform = getUniformSetter<Mat3>(gl, program, 'transform', Mat3.Length)
    const usePosBuffer = getAttributeSetter(gl, createBuffer(gl, [-1, 3, -1, -1, 3, -1]))

    return (transform: Mat3) => {
      gl.useProgram(program)
      setTransform(transform)
      usePosBuffer()
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
  })()

  const drawObjects = (() => {
    const program = compileProgram(gl, objectVertexShader, objectFragmentShader)
    const setTransform = getUniformSetter<Mat3>(gl, program, 'transform', 9)
    const setColor = getUniformSetter<vec4>(gl, program, 'color', 4)
    const S3O2 = Math.sqrt(3) / 2
    const usePosBuffer = getAttributeSetter(
      gl,
      createBuffer(gl, [0, 1, S3O2, 0.5, -S3O2, 0.5, S3O2, -0.5, -S3O2, -0.5, 0, -1])
    )

    return (cb: (draw: (transform: Mat3, color: vec4) => void) => void) => {
      gl.useProgram(program)
      usePosBuffer()

      cb((transform, color) => {
        setTransform(transform)
        setColor(color)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6)
      })
    }
  })()

  let lastTime = 0
  /** Hot render loop. Should allocate as lite as possible */
  function loop(time: number) {
    if (!state.running) return

    const delta = time - (lastTime || time)
    lastTime = time
    onUpdate(delta)

    if (resizeCanvasToPixel(canvas)) {
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const min = Math.min(canvas.width, canvas.height)
    const scale = 2 + 3 * (state.radius || 0)
    drawGrid(
      new Mat3()
        .identity()
        .translate(state.x - canvas.width / 2, state.y - canvas.height / 2)
        .scale(scale / min)
        .rotate(state.angle)
    )

    drawObjects((add) => {
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

function createBuffer(gl: WebGLRenderingContext, data: Iterable<number>) {
  const buffer = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
  return buffer
}
function getAttributeSetter(gl: WebGLRenderingContext, buffer: WebGLBuffer) {
  return () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  }
}

function getUniformSetter<T extends Float32List>(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
  size: number
) {
  gl.useProgram(program)
  const location = gl.getUniformLocation(program, name)
  if (!location) throw new Error(`uniform ${name} not found`)
  const uniformNf: ((t: T) => void) | undefined = {
    1: (t: T) => gl.uniform1f(location, t[0]),
    2: (t: T) => gl.uniform2f(location, ...(t as vec2)),
    3: (t: T) => gl.uniform3f(location, ...(t as vec3)),
    4: (t: T) => gl.uniform4f(location, ...(t as vec4)),
    9: gl.uniformMatrix3fv.bind(gl, location, false),
    16: gl.uniformMatrix4fv.bind(gl, location, false)
  }[size]
  if (!uniformNf) throw new Error(`unsupported uniform size: ${size}`)
  return uniformNf
}

function compileProgram(gl: WebGLRenderingContext, vertexShader: string, fragmentShader: string) {
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

function compileShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
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

type vec2 = [number, number]
type vec3 = [number, number, number]
type vec4 = [number, number, number, number]

class Mat3 extends Float32Array {
  static readonly Length = 9

  constructor() {
    super(9)
    this.fill(0)
  }
  identity() {
    this.fill(0)
    this[0] = this[4] = this[8] = 1
    return this
  }

  multiply(
    b00: number,
    b01: number,
    b02: number,
    b10: number,
    b11: number,
    b12: number,
    b20: number,
    b21: number,
    b22: number
  ) {
    const a00 = this[0],
      a01 = this[1],
      a02 = this[2]
    const a10 = this[3],
      a11 = this[4],
      a12 = this[5]
    const a20 = this[6],
      a21 = this[7],
      a22 = this[8]

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

  scale(n: number): Mat3
  scale(x: number, y: number): Mat3
  scale(x: number, y?: number) {
    return this.multiply(x, 0, 0, 0, y ?? x, 0, 0, 0, 1)
  }
  translate(x: number, y: number) {
    return this.multiply(1, 0, 0, 0, 1, 0, x, y, 1)
  }
  rotate(rad: number) {
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    return this.multiply(c, s, 0, -s, c, 0, 0, 0, 1)
  }
}

/*function fastMap<T, U>(array: T[], factory: (i: number) => U, apply: (value: T, to: U) => void, cache: U[]) {
  let i = cache.length
  cache.length = array.length
  for (; i < array.length; i++) {
    cache[i] = factory(i)
  }
  for (let i = 0; i < array.length; i++) {
    apply(array[i], cache[i])
  }
  return cache
}*/
