export interface ITransform {
  xx: number
  yx: number
  xy: number
  yy: number
  x: number
  y: number
}

export class Transform implements ITransform {
  xx = 1
  yx = 0
  xy = 0
  yy = 1
  x = 0
  y = 0

  top?: number
  left?: number
  width?: number
  height?: number

  constructor(
    xx?: Partial<ITransform> | number,
    yx?: number,
    xy?: number,
    yy?: number,
    x?: number,
    y?: number
  ) {
    this.transformTo(xx, yx, xy, yy, x, y)
  }

  transform(
    xx: Partial<ITransform> | number,
    yx: number,
    xy: number,
    yy: number,
    x?: number,
    y?: number
  ) {
    const m = this
    if (xx && typeof xx == 'object') {
      ;({ xx = 1, yx = 0, xy = 0, yy = 1, x, y } = xx)
    }
    if (!x) x = 0
    if (!y) y = 0
    return this.transformTo(
      m.xx * xx + m.xy * yx,
      m.yx * xx + m.yy * yx,
      m.xx * xy + m.xy * yy,
      m.yx * xy + m.yy * yy,
      m.xx * x + m.xy * y + m.x,
      m.yx * x + m.yy * y + m.y
    )
  }

  transformTo(
    xx?: Partial<ITransform> | number,
    yx?: number,
    xy?: number,
    yy?: number,
    x?: number,
    y?: number
  ) {
    if (xx && typeof xx == 'object') {
      ;({ xx, yx, xy, yy, x, y } = xx)
    }

    this.xx = xx == null ? 1 : xx
    this.yx = yx || 0
    this.xy = xy || 0
    this.yy = yy == null ? 1 : yy
    this.x = x || 0
    this.y = y || 0

    this._transform()
    return this
  }

  translate(x: number, y: number) {
    return x || y ? this.transform(1, 0, 0, 1, x, y) : this
  }

  move(x: number, y: number) {
    return this.moveTo(this.x + x, this.y + y)
  }

  scale(x: number, y = x) {
    return this.transform(x, 0, 0, y)
  }

  rotate(
    deg: number,
    x = (this.left || 0) + (this.width || 0) / 2,
    y = (this.top || 0) + (this.height || 0) / 2
  ) {
    const rad = (deg * Math.PI) / 180
    const sin = Math.sin(rad)
    const cos = Math.cos(rad)

    this.translate(x, y)

    const m = this
    return this.transformTo(
      cos * m.xx - sin * m.yx,
      sin * m.xx + cos * m.yx,
      cos * m.xy - sin * m.yy,
      sin * m.xy + cos * m.yy,
      m.x,
      m.y
    ).translate(-x, -y)
  }

  moveTo(x: number, y: number) {
    this.x = x
    this.y = y
    this._transform()
    return this
  }

  rotateTo(deg: number, x: number, y: number) {
    const { yx, xx, yy, xy } = this
    let flip = yx / xx > yy / xy ? -1 : 1
    if (xx < 0 ? xy >= 0 : xy < 0) flip = -flip
    return this.rotate(
      deg - (Math.atan2(flip * yx, flip * xx) * 180) / Math.PI,
      x,
      y
    )
  }

  scaleTo(x: number, y?: number) {
    // Normalize
    const m = this

    let h = Math.sqrt(m.xx * m.xx + m.yx * m.yx)
    m.xx /= h
    m.yx /= h

    h = Math.sqrt(m.yy * m.yy + m.xy * m.xy)
    m.yy /= h
    m.xy /= h

    return this.scale(x, y)
  }

  resizeTo(width: number, height: number) {
    const m = this
    return m.width && m.height
      ? this.scaleTo(width / m.width, height / m.height)
      : this
  }

  // inverse() {
  //   const { xx, yx, xy, yy, x, y } = this
  //   if (xx * yy - yx * xy == 0) {
  //     return null
  //   }
  //   return new Transform(
  //     yy / (xx * yy - yx * xy),
  //     yx / (yx * xy - xx * yy),
  //     xy / (yx * xy - xx * yy),
  //     xx / (xx * yy - yx * xy),
  //     (yy * x - xy * y) / (yx * xy - xx * yy),
  //     (yx * x - xx * y) / (xx * yy - yx * xy)
  //   )
  // }

  inversePoint(x: number, y: number) {
    const m = this
    const det = m.yx * m.xy - m.xx * m.yy
    if (det == 0) return null
    return {
      x: (m.yy * (m.x - x) + m.xy * (y - m.y)) / det,
      y: (m.xx * (m.y - y) + m.yx * (x - m.x)) / det,
    }
  }

  point(x: number, y: number) {
    const m = this
    return {
      x: m.xx * x + m.xy * y + m.x,
      y: m.yx * x + m.yy * y + m.y,
    }
  }

  /** Override this to apply the transform when it changes */
  protected _transform() {}
}
