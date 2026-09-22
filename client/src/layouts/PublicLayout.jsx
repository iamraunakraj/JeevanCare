import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

// Yeh layout Navbar aur Footer ko sabhi public pages
// (Home, Doctors, DoctorProfile) ke around wrap karta hai,
// taaki har page mein alag se Navbar/Footer likhna na pade.
function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default PublicLayout