import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Navbar />
        
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
