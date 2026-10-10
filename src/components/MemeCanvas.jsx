import { useEffect } from 'react'
import { renderMeme } from '../utils/meme'

export default function MemeCanvas({ canvasRef, image, options }) {
  useEffect(() => {
    if (canvasRef.current) {
      renderMeme(canvasRef.current, image, options)
    }
  }, [canvasRef, image, options])

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} className="meme-canvas" />
    </div>
  )
}