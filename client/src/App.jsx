import { Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'

function App() {
  return (
    <AuthProvider>
      <Header />
      <main className="pt-16 pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </AuthProvider>
  )
}

export default App
