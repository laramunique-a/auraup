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
function AppRoutes() {
  return (
    <div className="relative min-h-screen flex flex-col bg-aura-bg text-aura-text-primary font-sans antialiased">
      <Navbar />
      <main className="flex-1 relative z-10">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/deck/:id" element={<DeckPage />} />
          <Route path="/study/:id" element={<StudyPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
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
