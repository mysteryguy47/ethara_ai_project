import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Navbar from '../components/Navbar'
import '../App.css'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  function fetchProjects() {
    api.get('/projects').then(res => setProjects(res.data)).catch(console.log)
  }

  async function createProject(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/projects', form)
      setForm({ name: '', description: '' })
      setShowModal(false)
      fetchProjects()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project')
    }
  }

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <h1>Projects</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        </div>

        {projects.length === 0 && (
          <p style={{ color: '#5e6c84', fontSize: 14 }}>
            No projects yet. Create one to get started.
          </p>
        )}

        <div className="cards-grid">
          {projects.map(p => (
            <Link to={`/projects/${p.id}`} key={p.id}>
              <div className="card">
                <h3>{p.name}</h3>
                {p.description && <p style={{ marginTop: 4 }}>{p.description}</p>}
                <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: 12, color: '#5e6c84' }}>
                  <span>{p._count?.members ?? 0} members</span>
                  <span>{p._count?.tasks ?? 0} tasks</span>
                  {p.myRole === 'admin' && <span className="badge badge-admin">admin</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>New Project</h3>
            <form onSubmit={createProject}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
