const chroma = require('chroma-js')

module.exports = class USpectrumWave {
  constructor ({ context, buffer, source, canvas } = {}) {
    if (typeof canvas === 'string') canvas = document.getElementById(canvas)
    if (!canvas) {
      canvas = document.createElement('canvas')
      document.body.appendChild(canvas)
    }
    this.$canvas = canvas
    this.canvasContext = this.$canvas.getContext('2d')
    this.background = 'black'
    this.color = 'yellow'
    this.lineWidth = 0.25
    this.canvasContext.lineWidth = this.lineWidth
    this.fftSize = 1024
    this.minDb = -90
    this.maxDb = -10
    this.smoothing = 0.85
    this.startAngle = 0
    this.endAngle = 2 * Math.PI
    this.colors = ['yellow', 'white', 'blue']
    this.getColor = chroma.scale(this.colors).domain([0,255])
    this.isFilled = false
    this.setSize()
    this.setResizer()

    if (context && buffer && source) this.init({ context, buffer, source })
  }

  setSize () {
    this.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
    this.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    this.halfWidth = this.width/2
    this.halfHeight = this.height/2
    this.$canvas.width = this.width
    this.$canvas.height = this.height
  }

  setResizer () {
    let resizing = false

    window.addEventListener('resize', () => {
      if (resizing) return
      resizing = true

      setTimeout(() => {
        this.setSize()
        resizing = false
      }, this.resizeThrottle)
    })
  }

  init ({ context, buffer, source }) {
    this.analyser = context.createAnalyser()
    this.analyser.fftSize = this.fftSize
    this.analyser.minDecibels = this.minDb
    this.analyser.maxDecibels = this.maxDb
    this.analyser.smoothingTimeConstant = this.smoothing
    this.analyser.buffer = buffer
    source.connect(this.analyser)
    return this
  }

  setColors (colors) {
    this.colors = colors
  }

  setFilled (isFilled) {
    this.isFilled = isFilled
  }

  setFftSize (size) {
    this.fftSize = size
    return this
  }

  setMinDb (db) {
    this.minDb = db
    return this
  }

  setMaxDb (db) {
    this.maxDb = db
    return this
  }

  setSmoothing (smoothing) {
    this.smoothing = smoothing
  }

  setBackground (color) {
    this.background = color
    return this
  }

  setColor (color) {
    this.color = color
    return this
  }

  setLineWidth (width) {
    this.lineWidth = width
    return this
  }

  render () {
    const bufferLength = this.analyser.fftSize
    const buffer = new Uint8Array(bufferLength)
    window.requestAnimationFrame(() => this.render())
    this.analyser.getByteTimeDomainData(buffer)
    this.canvasContext.clearRect(0, 0, this.width, this.height)
    if (!this.isFilled) this.canvasContext.beginPath()

    for (let i = 0; i < bufferLength; i++) {
      const radius = buffer[i]
      const [red, green, blue] = this.getColor(radius)._rgb
      const alpha = i / 255
      if (this.isFilled) this.canvasContext.beginPath()
      
      const color = `rgba(${red}, ${green}, ${blue}, ${alpha})`
      this.canvasContext.strokeStyle = color
      this.canvasContext.arc(this.halfWidth, this.halfHeight, radius, this.startAngle, this.endAngle)

      if (this.isFilled) {
        const fillColor = `rgba(${red}, ${green}, ${blue}, 0.1)`
        this.canvasContext.fillStyle = fillColor
        this.canvasContext.fill()
      }
    }

    this.canvasContext.stroke()
  }
}
