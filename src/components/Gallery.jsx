import { FaSave } from "react-icons/fa";

export default function Gallery({ items, onSelect, onDelete }) {
  if (!items.length) {
    return (
      <div className="gallery-empty">
        Aucun mème enregistré pour le moment. Clique sur <strong><FaSave /> Enregistrer</strong> pour
        ajouter ta création ici.
      </div>
    )
  }

  return (
    <div className="gallery-grid">
      {items.map((item) => (
        <div key={item.id} className="gallery-item">
          <img
            src={item.dataUrl}
            alt="Mème enregistré"
            onClick={() => onSelect(item)}
            title="Charger dans l'éditeur"
          />
          <button
            className="gallery-delete"
            onClick={() => onDelete(item.id)}
            title="Supprimer"
            aria-label="Supprimer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}