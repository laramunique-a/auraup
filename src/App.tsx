import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { DeckProvider } from './contexts/DeckContext'
import { EconomyProvider } from './contexts/EconomyContext'
import { Navbar } from './components/layout/Navbar'
import { DashboardPage } from './pages/DashboardPage'
import { DeckPage } from './pages/DeckPage'
import { StudyPage } from './pages/StudyPage'
import { AdminPage } from './pages/AdminPage'
import { ProfilePage } from './pages/ProfilePage'
import { RankingPage } from './pages/RankingPage'
import { StorePage } from './pages/StorePage'
import { AuthPage } from './pages/AuthPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { FirstLoginModal } from './components/auth/FirstLoginModal'

function AppRoutes() {
  return (
    <div className="relative min-h-screen flex flex-col bg-aura-bg text-aura-text-primary font-sans antialiased">
      <Navbar />
      <FirstLoginModal />
      <main className="flex-1 relative z-10">
        <Routes>
          {/* Rota pública de login */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* Rotas protegidas (exigem estar autenticado) */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/deck/:id" 
            element={
              <ProtectedRoute>
                <DeckPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/study/:id" 
            element={
              <ProtectedRoute>
                <StudyPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ranking" 
            element={
              <ProtectedRoute>
                <RankingPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/store" 
            element={
              <ProtectedRoute>
                <StorePage />
              </ProtectedRoute>
            } 
          />

          {/* Rota administrativa com proteção estrita (apenas role === 'admin') */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

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
