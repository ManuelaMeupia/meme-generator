//Charge une image depuis une URL (blob ou dataURL) et renvoie un HTMLImageElement une fois chargé.
 export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image invalide'))
    img.src = src
  })
}

export const MAX_CANVAS_WIDTH = 900

//Dessine un bloc de texte (haut ou bas) sur le canvas,avec un contour noir (style mème classique).
function drawTextBlock(ctx, rawText, x, y, anchor, maxWidth, style) {
  const { fontSize, family, color, strokeColor } = style
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return

  // Ajustement automatique de la taille si le texte est trop large
  let size = fontSize
  const setFont = (s) => {
    ctx.font = `bold ${s}px ${family}`
  }
  setFont(size)
  while (size > 12 && lines.some((l) => ctx.measureText(l).width > maxWidth)) {
    size -= 2
    setFont(size)
  }

  const lineHeight = size * 1.12
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.lineWidth = Math.max(2, size * 0.16)
  ctx.strokeStyle = strokeColor
  ctx.fillStyle = color

  lines.forEach((line, i) => {
    const baselineY =
      anchor === 'top'
        ? y + size * 0.82 + i * lineHeight
        : y - (lines.length - 1 - i) * lineHeight

    ctx.strokeText(line, x, baselineY)
    ctx.fillText(line, x, baselineY)
  })
}

//Rendu complet du mème sur le canvas.
export function renderMeme(canvas, image, options = {}) {
  const ctx = canvas.getContext('2d')

  const {
    topText = '',
    bottomText = '',
    fontSize = 56,
    fontFamily = 'Impact',
    color = '#ffffff',
    strokeColor = '#000000',
    uppercase = true,
  } = options

  // Cas : aucune image chargée → on dessine un placeholder
  if (!image) {
    canvas.width = 720
    canvas.height = 440
    ctx.fillStyle = '#12121c'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#4a4a63'
    ctx.font = '500 20px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(' Charge une image pour commencer', canvas.width / 2, canvas.height / 2)
    return
  }

  // Calcul des dimensions du canvas
  const naturalW = image.naturalWidth || image.width
  const naturalH = image.naturalHeight || image.height
  const scale = Math.min(1, MAX_CANVAS_WIDTH / naturalW)

  canvas.width = Math.max(1, Math.round(naturalW * scale))
  canvas.height = Math.max(1, Math.round(naturalH * scale))

  // Nettoyage + dessin de l'image
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  // Textes
  const pad = Math.max(12, canvas.width * 0.035)
  const maxWidth = canvas.width - pad * 2
  const family = `${fontFamily}, Impact, "Arial Black", sans-serif`
  const transform = (s) => (uppercase ? s.toUpperCase() : s)
  const style = { fontSize, family, color, strokeColor }

  drawTextBlock(ctx, transform(topText), canvas.width / 2, pad, 'top', maxWidth, style)
  drawTextBlock(
    ctx,
    transform(bottomText),
    canvas.width / 2,
    canvas.height - pad,
    'bottom',
    maxWidth,
    style
  )
}

//Convertit un canvas en Blob PNG
export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

//Génère une miniature JPEG compressée pour la galerie (localStorage a une limite d'environ 5 Mo)
export function canvasToThumb(source, maxWidth = 700, quality = 0.78) {
  const tmp = document.createElement('canvas')
  const scale = Math.min(1, maxWidth / source.width)
  tmp.width = Math.round(source.width * scale)
  tmp.height = Math.round(source.height * scale)
  const ctx = tmp.getContext('2d')
  ctx.drawImage(source, 0, 0, tmp.width, tmp.height)
  return tmp.toDataURL('image/jpeg', quality)
}