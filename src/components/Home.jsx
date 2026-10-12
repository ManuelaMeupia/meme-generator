import { FaImage, FaSave } from "react-icons/fa";
import { IoText } from "react-icons/io5";

export default function Home({ onStart }) {
  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-badge">Générateur de mèmes en ligne</div>

        <h1 className="home-title">
          Crée des mèmes hilarants en quelques secondes
        </h1>

        <p className="home-subtitle">
          Charge une image, ajoute ton texte, personnalise le style et partage ta création
          avec le monde entier. Simple, rapide, gratuit.
        </p>

        <button className="btn btn-primary btn-lg" style={{backgroundColor:'white', color:'black'}} onClick={onStart}>
           Commencer
        </button>

        <div className="home-features">
          <div className="feature">
            <div className="feature-icon"><FaImage /></div>
            <h3>Importe ton image</h3>
            <p>Glisse-dépose ou choisis une image depuis ton appareil.</p>
          </div>

          <div className="feature">
            <div className="feature-icon"><IoText /></div>
            <h3>Ajoute ton texte</h3>
            <p>Personnalise police, taille, couleurs et contour.</p>
          </div>

          <div className="feature">
            <div className="feature-icon"><FaSave /></div>
            <h3>Sauvegarde et partage</h3>
            <p>Télécharge en PNG, enregistre dans ta galerie ou partage.</p>
          </div>
        </div>
      </div>
    </div>
  )
}