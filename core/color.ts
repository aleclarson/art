const colors = {
  maroon: '#800000',
  red: '#ff0000',
  orange: '#ffA500',
  yellow: '#ffff00',
  olive: '#808000',
  purple: '#800080',
  fuchsia: '#ff00ff',
  white: '#ffffff',
  lime: '#00ff00',
  green: '#008000',
  navy: '#000080',
  blue: '#0000ff',
  aqua: '#00ffff',
  teal: '#008080',
  black: '#000000',
  silver: '#c0c0c0',
  gray: '#808080',
}

const map = function(array, fn) {
  const results = []
  for (let i = 0, l = array.length; i < l; i++) results[i] = fn(array[i], i)
  return results
}

const Color = function(color, type) {
  if (color.isColor) {
    this.red = color.red
    this.green = color.green
    this.blue = color.blue
    this.alpha = color.alpha
  } else {
    const namedColor = colors[color]
    if (namedColor) {
      color = namedColor
      type = 'hex'
    }

    switch (typeof color) {
      case 'string':
        if (!type)
          type = (type = color.match(/^rgb|^hsb|^hsl/)) ? type[0] : 'hex'
        break
      case 'object':
        type = type || 'rgb'
        color = color.toString()
        break
      case 'number':
        type = 'hex'
        color = color.toString(16)
        break
    }

    color = Color['parse' + type.toUpperCase()](color)
    this.red = color[0]
    this.green = color[1]
    this.blue = color[2]
    this.alpha = color[3]
  }

  this.isColor = true
}

const limit = function(number, min, max) {
  return Math.min(max, Math.max(min, number))
}

const listMatch = /([-.\d]+\%?)\s*,\s*([-.\d]+\%?)\s*,\s*([-.\d]+\%?)\s*,?\s*([-.\d]*\%?)/
const hexMatch = /^#?([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{0,2})$/i

Color.parseRGB = function(color) {
  return map(color.match(listMatch).slice(1), function(bit, i) {
    if (bit) bit = parseFloat(bit) * (bit[bit.length - 1] == '%' ? 2.55 : 1)
    return i < 3
      ? Math.round((bit %= 256) < 0 ? bit + 256 : bit)
      : limit(bit === '' ? 1 : Number(bit), 0, 1)
  })
}

Color.parseHEX = function(color) {
  if (color.length == 1) color = color + color + color
  return map(color.match(hexMatch).slice(1), function(bit, i) {
    if (i == 3) return bit ? parseInt(bit, 16) / 255 : 1
    return parseInt(bit.length == 1 ? bit + bit : bit, 16)
  })
}

Color.parseHSB = function(color) {
  const hsb = map(color.match(listMatch).slice(1), function(bit, i) {
    if (bit) bit = parseFloat(bit)
    if (i === 0) return Math.round((bit %= 360) < 0 ? bit + 360 : bit)
    else if (i < 3) return limit(Math.round(bit), 0, 100)
    else return limit(bit === '' ? 1 : Number(bit), 0, 1)
  })

  const a = hsb[3]
  const br = Math.round((hsb[2] / 100) * 255)
  if (hsb[1] == 0) return [br, br, br, a]

  const hue = hsb[0]
  const f = hue % 60
  const p = Math.round(((hsb[2] * (100 - hsb[1])) / 10000) * 255)
  const q = Math.round(((hsb[2] * (6000 - hsb[1] * f)) / 600000) * 255)
  const t = Math.round(((hsb[2] * (6000 - hsb[1] * (60 - f))) / 600000) * 255)

  switch (Math.floor(hue / 60)) {
    case 0:
      return [br, t, p, a]
    case 1:
      return [q, br, p, a]
    case 2:
      return [p, br, t, a]
    case 3:
      return [p, q, br, a]
    case 4:
      return [t, p, br, a]
    default:
      return [br, p, q, a]
  }
}

Color.parseHSL = function(color) {
  const hsb = map(color.match(listMatch).slice(1), function(bit, i) {
    if (bit) bit = parseFloat(bit)
    if (i === 0) return Math.round((bit %= 360) < 0 ? bit + 360 : bit)
    else if (i < 3) return limit(Math.round(bit), 0, 100)
    else return limit(bit === '' ? 1 : Number(bit), 0, 1)
  })

  const h = hsb[0] / 60
  const s = hsb[1] / 100
  const l = hsb[2] / 100
  const a = hsb[3]

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h % 2) - 1))
  const m = l - c / 2

  const p = Math.round((c + m) * 255)
  const q = Math.round((x + m) * 255)
  const t = Math.round(m * 255)

  switch (Math.floor(h)) {
    case 0:
      return [p, q, t, a]
    case 1:
      return [q, p, t, a]
    case 2:
      return [t, p, q, a]
    case 3:
      return [t, q, p, a]
    case 4:
      return [q, t, p, a]
    default:
      return [p, t, q, a]
  }
}

const toString = function(type, array) {
  if (array[3] != 1) type += 'a'
  else array.pop()
  return type + '(' + array.join(', ') + ')'
}

Color.prototype = {
  toHSB: function(array) {
    const red = this.red,
      green = this.green,
      blue = this.blue,
      alpha = this.alpha

    const max = Math.max(red, green, blue),
      min = Math.min(red, green, blue),
      delta = max - min
    let hue = 0,
      saturation = delta != 0 ? delta / max : 0,
      brightness = max / 255
    if (saturation) {
      const rr = (max - red) / delta,
        gr = (max - green) / delta,
        br = (max - blue) / delta
      hue = red == max ? br - gr : green == max ? 2 + rr - br : 4 + gr - rr
      if ((hue /= 6) < 0) hue++
    }

    const hsb = [
      Math.round(hue * 360),
      Math.round(saturation * 100),
      Math.round(brightness * 100),
      alpha,
    ]

    return array ? hsb : toString('hsb', hsb)
  },

  toHSL: function(array) {
    const red = this.red,
      green = this.green,
      blue = this.blue,
      alpha = this.alpha

    const max = Math.max(red, green, blue),
      min = Math.min(red, green, blue),
      delta = max - min
    let hue = 0,
      saturation = delta != 0 ? delta / (255 - Math.abs(max + min - 255)) : 0,
      lightness = (max + min) / 512
    if (saturation) {
      const rr = (max - red) / delta,
        gr = (max - green) / delta,
        br = (max - blue) / delta
      hue = red == max ? br - gr : green == max ? 2 + rr - br : 4 + gr - rr
      if ((hue /= 6) < 0) hue++
    }

    const hsl = [
      Math.round(hue * 360),
      Math.round(saturation * 100),
      Math.round(lightness * 100),
      alpha,
    ]

    return array ? hsl : toString('hsl', hsl)
  },

  toHEX: function(array) {
    let a = this.alpha
    const alpha = (a = Math.round(a * 255).toString(16)).length == 1 ? a + a : a

    const hex = map([this.red, this.green, this.blue], function(bit) {
      bit = bit.toString(16)
      return bit.length == 1 ? '0' + bit : bit
    })

    return array
      ? hex.concat(alpha)
      : '#' + hex.join('') + (alpha == 'ff' ? '' : alpha)
  },

  toRGB: function(array) {
    const rgb = [this.red, this.green, this.blue, this.alpha]
    return array ? rgb : toString('rgb', rgb)
  },
}

Color.prototype.toString = Color.prototype.toRGB

Color.hex = function(hex) {
  return new Color(hex, 'hex')
}

Color.hsb = function(h, s, b, a) {
  return new Color([h || 0, s || 0, b || 0, a == null ? 1 : a], 'hsb')
}

Color.hsl = function(h, s, l, a) {
  return new Color([h || 0, s || 0, l || 0, a == null ? 1 : a], 'hsl')
}

Color.rgb = function(r, g, b, a) {
  return new Color([r || 0, g || 0, b || 0, a == null ? 1 : a], 'rgb')
}

Color.detach = function(color) {
  color = new Color(color)
  return [Color.rgb(color.red, color.green, color.blue).toString(), color.alpha]
}

module.exports = Color
