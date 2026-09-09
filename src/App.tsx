import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { EstateMapPage } from './pages/EstateMapPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/map" element={<EstateMapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
