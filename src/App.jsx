import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import ImageUploader from './components/ImageUploader'
import MemeCanvas from './components/MemeCanvas'
import Gallery from './components/Gallery'
import { loadImage, canvasToBlob, canvasToThumb } from './utils/meme'

const FONTS = [
  { label: 'Impact', value: 'Impact' },
  { label: 'Arial Black', value: '"Arial Black"' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: '"Courier New"' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS"' },
  { label: 'Verdana', value: 'Verdana' },
]

const STORAGE_KEY = 'meme-generator:gallery'
const MAX_GALLERY = 30

function loadGalleryFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function App() {
  const [image, setImage] = useState(null)

  // --- Textes ---
  const [topText, setTopText] = useState('QUAND TU CODES')
  const [bottomText, setBottomText] = useState('ET QUE ÇA MARCHE')

  // --- Style ---
  const [fontSize, setFontSize] = useState(56)
  const [fontFamily, setFontFamily] = useState('Impact')
  const [color, setColor] = useState('#ffffff')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [uppercase, setUppercase] = useState(true)

  // --- Galerie + UI ---
  const [gallery, setGallery] = useState(loadGalleryFromStorage)
  const [toast, setToast] = useState(null)

  const canvasRef = useRef(null)
  const objectUrlRef = useRef(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  // --- Sauvegarde galerie dans localStorage ---
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery))
    } catch (e) {
      console.warn('Galerie non sauvegardée (quota localStorage dépassé ?)', e)
    }
  }, [gallery])

  // --- Toast ---
  const notify = useCallback((message, type = 'info') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(id)
  }, [toast])

  // --- Image ---
  const handleImageSelected = useCallback(
    async (url) => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = url

      try {
        const img = await loadImage(url)
        setImage(img)
        notify('Image chargée ✔')
      } catch {
        notify("Impossible de charger l'image.", 'error')
        URL.revokeObjectURL(url)
        objectUrlRef.current = null
      }
    },
    [notify]
  )

  const handleReset = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImage(null)
  }, [])

  // --- Téléchargement ---
  const handleDownload = useCallback(async () => {
    if (!image) {
      notify("Charge d'abord une image.", 'error')
      return
    }
    const blob = await canvasToBlob(canvasRef.current)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meme-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify('Mème téléchargé ✔')
  }, [image, notify])

    // --- Partage ---
  const handleShare = useCallback(async () => {
    if (!image) {
      notify("Charge d'abord une image.", 'error')
      return
    }

    const blob = await canvasToBlob(canvasRef.current)
    if (!blob) return

    const file = new File([blob], 'meme.png', { type: 'image/png' })
    const shareData = {
      files: [file],
      title: 'Mon mème',
      text: 'Regarde le mème que je viens de créer !',
    }

    // Cas 1 : partage natif supporté (mobile, certains navigateurs)
    if (navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        notify('Partagé ✔')
      } catch (err) {
        if (err.name !== 'AbortError') {
          notify('Partage annulé', 'error')
        }
      }
      return
    }

    // Cas 2 : fallback → copie l'image dans le presse-papiers
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      notify('Image copiée dans le presse-papiers 📋')
    } catch {
      notify('Partage non supporté : utilise Télécharger.', 'error')
    }
  }, [image, notify])

  // --- Enregistrer dans la galerie ---
  const handleSave = useCallback(() => {
    if (!image) {
      notify("Charge d'abord une image.", 'error')
      return
    }

    const dataUrl = canvasToThumb(canvasRef.current)
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now())

    setGallery((prev) =>
      [{ id, dataUrl, createdAt: Date.now() }, ...prev].slice(0, MAX_GALLERY)
    )
    notify('Mème ajouté à la galerie ✔')
  }, [image, notify])

  // --- Supprimer de la galerie ---
  const handleDeleteFromGallery = useCallback((id) => {
    setGallery((prev) => prev.filter((i) => i.id !== id))
  }, [])

  // --- Charger un mème depuis la galerie ---
  const handleSelectFromGallery = useCallback(
    async (item) => {
      try {
        const img = await loadImage(item.dataUrl)
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }
        setImage(img)
        notify("Mème chargé dans l'éditeur")
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch {
        notify('Impossible de charger ce mème.', 'error')
      }
    },
    [notify]
  )

  const options = useMemo(
    () => ({
      topText,
      bottomText,
      fontSize,
      fontFamily,
      color,
      strokeColor,
      uppercase,
    }),
    [topText, bottomText, fontSize, fontFamily, color, strokeColor, uppercase]
  )

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 Générateur de Mèmes</h1>
                <p>Crée, télécharge, partage tes mèmes 🎉</p>
      </header>

      <main className="app-main">
        <ImageUploader onImageSelected={handleImageSelected} />

        {image && (
          <button className="btn" onClick={handleReset}>
            Retirer l'image
          </button>
        )}

        <div className="editor">
          <div className="preview-column">
            <MemeCanvas canvasRef={canvasRef} image={image} options={options} />

                        <div className="actions">
              <button
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={!image}
              >
                ⬇ Télécharger
              </button>
              <button className="btn" onClick={handleShare} disabled={!image}>
                🔗 Partager
              </button>
              <button className="btn" onClick={handleSave} disabled={!image}>
                💾 Enregistrer
              </button>
            </div>
          </div>

          <div className="controls">
            <div className="control-group">
              <label className="label" htmlFor="topText">
                Texte du haut
              </label>
              <textarea
                id="topText"
                className="input"
                rows={2}
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                placeholder="QUAND TU CODES..."
              />
            </div>

            <div className="control-group">
              <label className="label" htmlFor="bottomText">
                Texte du bas
              </label>
              <textarea
                id="bottomText"
                className="input"
                rows={2}
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder="...ET QUE ÇA MARCHE"
              />
            </div>

            <div className="control-group">
              <label className="label" htmlFor="fontFamily">
                Police
              </label>
              <select
                id="fontFamily"
                className="input"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <div className="label-row">
                <label className="label" htmlFor="fontSize">
                  Taille du texte
                </label>
                <span className="value">{fontSize}px</span>
              </div>
              <input
                id="fontSize"
                type="range"
                min="20"
                max="140"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="range"
              />
            </div>

            <div className="control-group colors">
              <div className="color-field">
                <label className="label" htmlFor="color">
                  Couleur
                </label>
                <input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
              <div className="color-field">
                <label className="label" htmlFor="stroke">
                  Contour
                </label>
                <input
                  id="stroke"
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                />
              </div>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
              />
              <span>Texte en MAJUSCULES</span>
            </label>
          </div>
        </div>

        {/* ---------- Galerie ---------- */}
        <section className="gallery-section">
          <div className="gallery-header">
            <h2>Galerie</h2>
            <span className="muted">{gallery.length} mème(s)</span>
          </div>
          <Gallery
            items={gallery}
            onSelect={handleSelectFromGallery}
            onDelete={handleDeleteFromGallery}
          />
        </section>
      </main>

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  )
}