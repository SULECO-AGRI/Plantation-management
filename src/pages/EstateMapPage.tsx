import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlantationMap } from '../components/map'

export function EstateMapPage() {
  return (
    <main className="estate-page">
      <header className="estate-header">
        <Link to="/" className="nav-brand">
          <span className="nav-brand__text">
            <strong>Plantation Management</strong>
          </span>
        </Link>
        <div className="estate-header__right">
          <Link to="/" className="back-link"><ArrowLeft size={15} /> Overview</Link>
        </div>
      </header>
      <div className="estate-map-stage">
        <PlantationMap />
      </div>
    </main>
  )
}
