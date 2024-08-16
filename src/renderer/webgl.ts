import { Mat3 } from './math'
import { vec2, vec3, vec4 } from './types'
export { Mat3 } from './math'

export function setupWebGl(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2')
  if (!gl) throw new Error('webgl2 not supported')
  return {
    resize: () => gl.viewport(0, 0, canvas.width, canvas.height),
    clear: () => clearFrame(gl),
    drawGrid: compileGridPipeline(gl),
    drawObjects: compileObjectsPipeline(gl)
  }
}

import passthroughVertexShader from './glsl/passthrough.vs'
import hexFragmentShader from './glsl/hex.fs'
function compileGridPipeline(gl: WebGLRenderingContext) {
  const program = compileProgram(gl, passthroughVertexShader, hexFragmentShader)
  const setTransform = getUniformSetter<Mat3>(gl, program, 'transform', Mat3.Length)
  const usePosBuffer = getAttributeSetter(gl, createBuffer(gl, [-1, 3, -1, -1, 3, -1]))

  return (transform: Mat3) => {
    gl.useProgram(program)
    setTransform(transform)
    usePosBuffer()
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}

import objectVertexShader from './glsl/object.vs'
import objectFragmentShader from './glsl/object.fs'
function compileObjectsPipeline(gl: WebGLRenderingContext) {
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
}

function clearFrame(gl: WebGLRenderingContext) {
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
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
