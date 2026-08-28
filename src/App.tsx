import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Navbar } from './components/layout/Navbar'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { DeckPage } from './pages/DeckPage'
import { StudyPage } from './pages/StudyPage'
import { AdminPage } from './pages/AdminPage'
import { ProfilePage } from './pages/ProfilePage'
import { RankingPage } from './pages/RankingPage'
import { StorePage } from './pages/StorePage'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div className="spinner"></div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

import { StarfieldCanvas } from './components/ui/StarfieldCanvas'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return null

  // Redirecionar para completar perfil se não tiver nickname (exceto se já estiver na página de perfil)
  const needsProfileUpdate = user && user.role !== 'admin' && !user.nickname && location.pathname !== '/profile' && location.pathname !== '/login'

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f8fafc] text-[#0f172a] page-transition">
      <StarfieldCanvas />
      <Navbar />
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {needsProfileUpdate && (
          <div style={{ background: 'var(--accent)', color: 'white', padding: '0.75rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
            🚀 Quase lá! Escolha um apelido no seu perfil para aparecer no ranking. 
            <Link to="/profile" style={{ color: 'white', marginLeft: '0.5rem', textDecoration: 'underline' }}>Configurar agora</Link>
          </div>
        )}
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <AuthPage />}
          />
          <Route
            path="/"
            element={<RequireAuth><DashboardPage /></RequireAuth>}
          />
          <Route
            path="/deck/:id"
            element={<RequireAuth><DeckPage /></RequireAuth>}
          />
          <Route
            path="/study/:id"
            element={<RequireAuth><StudyPage /></RequireAuth>}
          />
          <Route
            path="/admin"
            element={<RequireAdmin><AdminPage /></RequireAdmin>}
          />
          <Route
            path="/profile"
            element={<RequireAuth><ProfilePage /></RequireAuth>}
          />
          <Route
            path="/ranking"
            element={<RequireAuth><RankingPage /></RequireAuth>}
          />
          <Route
            path="/store"
            element={<RequireAuth><StorePage /></RequireAuth>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

import { ThemeProvider } from './contexts/ThemeContext'
import { DeckProvider } from './contexts/DeckContext'
import { EconomyProvider } from './contexts/EconomyContext'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <EconomyProvider>
            <DeckProvider>
              <AppRoutes />
            </DeckProvider>
          </EconomyProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
