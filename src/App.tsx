import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { EstateMapPage } from './pages/EstateMapPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppProviders } from './context'

export default function App() {
  return (
    <AppProviders>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected GIS Map Views */}
        <Route
          path="/map"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Officer']}>
              <EstateMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map/watawala"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Officer']}>
              <EstateMapPage defaultPlantation="Watawala" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map/agalawatte"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Officer']}>
              <EstateMapPage defaultPlantation="Agalawatte" />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProviders>
  )
}
