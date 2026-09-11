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
import { MobileBottomNav } from './components/layout/MobileBottomNav'
import { ScrollToTop } from './components/common/ScrollToTop'

function AppRoutes() {
  return (
    <div className="relative min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col bg-aura-bg text-aura-text-primary font-sans antialiased pb-16 md:pb-0">
      <Navbar />
      <FirstLoginModal />
      <main className="flex-1 flex flex-col">
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
      <MobileBottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
