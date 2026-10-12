import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import ImageUploader from './components/ImageUploader'
import MemeCanvas from './components/MemeCanvas'
import Gallery from './components/Gallery'
import Home from './components/Home'
import { loadImage, canvasToBlob, canvasToThumb } from './utils/meme'

import { MdDownload, MdGeneratingTokens } from "react-icons/md";
import { FaShareAlt, FaSave, FaDownload } from "react-icons/fa";

const FONTS = [
  { label: 'Impact', value: 'Impact' },
  { label: 'Arial Black', value: '"Arial Black"' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: '"Courier New"' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS"' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Times New Roman', value: '"Times New Roman"' },
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
    const [page, setPage] = useState('home')

    const [image, setImage] = useState(null)

  const [topText, setTopText] = useState('')
  const [bottomText, setBottomText] = useState('')

  const [fontSize, setFontSize] = useState(56)
  const [fontFamily, setFontFamily] = useState('Impact')
  const [color, setColor] = useState('#ffffff')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [uppercase, setUppercase] = useState(true)

    const [gallery, setGallery] = useState(loadGalleryFromStorage)
  const [toast, setToast] = useState(null)

  const canvasRef = useRef(null)
  const objectUrlRef = useRef(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])


  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gallery))
    } catch (e) {
      console.warn('Galerie non sauvegardée (quota localStorage dépassé ?)', e)
    }
  }, [gallery])

   const notify = useCallback((message, type = 'info') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(id)
  }, [toast])

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
      title: 'Mon meme',
      text: 'Regarde le mème que je viens de créer !',
    }

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

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      notify('Image copiée dans le presse-papiers')
    } catch {
      notify('Partage non supporté : utilise Télécharger.', 'error')
    }
  }, [image, notify])

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
    notify('Meme ajouté à la galerie ✔')
  }, [image, notify])

  const handleDeleteFromGallery = useCallback((id) => {
    setGallery((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const handleSelectFromGallery = useCallback(
    async (item) => {
      try {
        const img = await loadImage(item.dataUrl)
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }
        setImage(img)
        notify("Meme chargé dans l'éditeur")
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch {
        notify('Impossible de charger ce meme.', 'error')
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

  if (page === 'home') {
    return <Home onStart={() => setPage('editor')} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <button className="btn btn-ghost btn-sm" onClick={() => setPage('home')}>
          ← Accueil
        </button>
        <h1><MdGeneratingTokens /> Générateur de Memes</h1>
        <p>Crée, télécharge, partage tes memes</p>
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
                <FaDownload /> Télécharger
              </button>
              <button className="btn" onClick={handleShare} disabled={!image}>
                <FaShareAlt /> Partager
              </button>
              <button className="btn" onClick={handleSave} disabled={!image}>
                <FaSave /> Enregistrer
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
                // placeholder="QUAND TU CODES..."
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
                // placeholder="...ET QUE ÇA MARCHE"
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

            {/* <label className="checkbox">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
              />
              <span>Texte en MAJUSCULES</span>
            </label> */}
          </div>
        </div>

        <section className="gallery-section">
          <div className="gallery-header">
            <h2>Galerie</h2>
            <span className="muted">{gallery.length} meme(s)</span>
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