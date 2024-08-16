export class Mat3 extends Float32Array {
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
