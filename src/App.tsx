import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { blink } from './blink/client'
import { Sidebar, SidebarContent, SidebarProvider } from './components/ui/sidebar'
import { AppSidebar } from './components/AppSidebar'
import { Dashboard } from './pages/Dashboard'
import { DifferentiationWorkshop } from './pages/DifferentiationWorkshop'
import { DailyReflection } from './pages/DailyReflection'
import { ConceptLibrary } from './pages/ConceptLibrary'
import { AiChat } from './pages/AiChat'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-3xl font-bold mb-4">AI Differentiation & Reflection</h1>
          <p className="text-muted-foreground mb-6">
            Create unique differentiation strategies and practice self-reflection with AI guidance.
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/workshop" element={<DifferentiationWorkshop />} />
              <Route path="/reflection" element={<DailyReflection />} />
              <Route path="/library" element={<ConceptLibrary />} />
              <Route path="/chat" element={<AiChat />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    </Router>
  )
}

export default App