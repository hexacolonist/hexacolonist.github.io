import passthroughVertexShader from './glsl/passthrough.vs'
import hexFragmentShader from './glsl/hex.fs'

export interface RenderState {
  offset: [number, number]
  scale: [number, number]
}
export default function render(canvas: HTMLCanvasElement, state: RenderState) {
  const gl = canvas.getContext('webgl2')!
  if (!gl) throw new Error('webgl2 not supported')

  const program = compileProgram(gl, passthroughVertexShader, hexFragmentShader)
  gl.useProgram(program)

  const triangleBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 3, -1, -1, 3, -1]), gl.STATIC_DRAW)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(0)

  const offsetScaleLoc = gl.getUniformLocation(program, 'offset_scale')!

  //let lastTime = 0
  function loop(/*time: number*/) {
    // const delta = time - (lastTime || time)
    //lastTime = time

    if (resizeCanvasToPixel(canvas)) {
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    gl.uniform4f(offsetScaleLoc, ...state.offset, ...state.scale)

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
