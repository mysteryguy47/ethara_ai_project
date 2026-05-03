import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  function handleLogout() {
    logout()
    nav('/login')
  }

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" className="brand">TaskFlow</Link>
        <Link to="/">Dashboard</Link>
        <Link to="/projects">Projects</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13 }}>{user?.name}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}
