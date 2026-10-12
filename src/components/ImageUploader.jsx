import { FaImage} from "react-icons/fa";
import { useRef, useState } from 'react'

export default function ImageUploader({ onImageSelected }) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  function handleFile(file) {
    setError(null)

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Format non supporté. Choisis une image (PNG, JPG, JPEG, WEBP…).')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Image trop lourde (15 Mo maximum).')
      return
    }

    const url = URL.createObjectURL(file)
    onImageSelected(url, file)
  }

  return (
    <div className="uploader">
      <div
        className={`dropzone ${dragOver ? 'is-over' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        <span className="dropzone-icon"><FaImage /></span>
        <span className="dropzone-text">Clique ou glisse une image ici</span>
        <span className="dropzone-hint">PNG, JPG, WEBP — max 15 Mo</span>
      </div>

      {error && <p className="error-msg">{error}</p>}
    </div>
  )
}