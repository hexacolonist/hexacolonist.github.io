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

export type vec2 = [number, number]
export type vec3 = [number, number, number]
export type vec4 = [number, number, number, number]
