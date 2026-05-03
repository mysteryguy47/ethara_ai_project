import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import '../App.css'

const STATUS_OPTIONS = ['todo', 'in-progress', 'done']

function TaskCard({ task, members, onUpdate, onDelete, isAdmin }) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(task.status)
  const [assignedTo, setAssignedTo] = useState(task.assignedTo ?? '')

  const isOverdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date()

  async function save() {
    await onUpdate(task.id, { status, assignedTo: assignedTo || null })
    setEditing(false)
  }

  function badgeClass() {
    if (isOverdue) return 'badge badge-overdue'
    if (task.status === 'done') return 'badge badge-done'
    if (task.status === 'in-progress') return 'badge badge-progress'
    return 'badge badge-todo'
  }

  return (
    <li className="task-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="task-title">{task.title}</div>
          {task.description && <div className="task-meta">{task.description}</div>}
          <div className="task-meta" style={{ marginTop: 4 }}>
            {task.assignee ? `Assigned to: ${task.assignee.name}` : 'Unassigned'}
            {task.dueDate && ` · Due: ${new Date(task.dueDate).toLocaleDateString()}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={badgeClass()}>{isOverdue ? 'overdue' : task.status}</span>
          <button className="btn btn-sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
          {isAdmin && (
            <button className="btn btn-sm btn-danger" onClick={() => onDelete(task.id)}>Del</button>
          )}
        </div>
      </div>

      {editing && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', paddingTop: 4 }}>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '4px 8px' }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={assignedTo} onChange={e => setAssignedTo(e.target.value ? parseInt(e.target.value) : '')} style={{ padding: '4px 8px' }}>
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
        </div>
      )}
    </li>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '' })
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('member')
  const [err, setErr] = useState('')

  const isAdmin = project?.members?.find(m => m.user.id === user?.id)?.role === 'admin'

  useEffect(() => {
    loadProject()
  }, [id])

  function loadProject() {
    api.get(`/projects/${id}`)
      .then(res => setProject(res.data))
      .catch(() => nav('/projects'))
      .finally(() => setLoading(false))
  }

  async function createTask(e) {
    e.preventDefault()
    setErr('')
    try {
      await api.post(`/tasks/project/${id}`, {
        ...taskForm,
        assignedTo: taskForm.assignedTo ? parseInt(taskForm.assignedTo) : undefined,
        dueDate: taskForm.dueDate || undefined
      })
      setTaskForm({ title: '', description: '', assignedTo: '', dueDate: '' })
      setShowTaskModal(false)
      loadProject()
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed')
    }
  }

  async function addMember(e) {
    e.preventDefault()
    setErr('')
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole })
      setMemberEmail('')
      setShowMemberModal(false)
      loadProject()
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed')
    }
  }

  async function updateTask(taskId, updates) {
    try {
      await api.put(`/tasks/${taskId}`, updates)
      loadProject()
    } catch (e) {
      console.log('update task failed:', e.message)
    }
  }

  async function deleteTask(taskId) {
    if (!window.confirm('Delete this task?')) return
    await api.delete(`/tasks/${taskId}`)
    loadProject()
  }

  if (loading) return <><Navbar /><div className="page">Loading...</div></>
  if (!project) return null

  const grouped = {
    todo: project.tasks.filter(t => t.status === 'todo'),
    'in-progress': project.tasks.filter(t => t.status === 'in-progress'),
    done: project.tasks.filter(t => t.status === 'done'),
  }

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1>{project.name}</h1>
            {project.description && <p style={{ fontSize: 14, color: '#5e6c84', marginTop: 4 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>
                + Add Member
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
              + Add Task
            </button>
          </div>
        </div>

        <div className="section-title">Members</div>
        <div className="members-list">
          {project.members.map(m => (
            <div key={m.id} className="member-chip">
              {m.user.name}
              {m.role === 'admin' && <span className="badge badge-admin" style={{ fontSize: 10 }}>admin</span>}
            </div>
          ))}
        </div>

        {/* tasks grouped by status */}
        {Object.entries(grouped).map(([status, tasks]) => (
          <div key={status}>
            <div className="section-title" style={{ marginTop: 20 }}>
              {status} ({tasks.length})
            </div>
            {tasks.length === 0
              ? <p style={{ fontSize: 13, color: '#8993a4' }}>None</p>
              : (
                <ul className="task-list">
                  {tasks.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      members={project.members}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      isAdmin={isAdmin}
                    />
                  ))}
                </ul>
              )
            }
          </div>
        ))}
      </div>

      {/* task modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Task</h3>
            <form onSubmit={createTask}>
              <div className="form-group">
                <label>Title</label>
                <input
                  value={taskForm.title}
                  onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select
                  value={taskForm.assignedTo}
                  onChange={e => setTaskForm(p => ({ ...p, assignedTo: e.target.value }))}
                >
                  <option value="">— nobody —</option>
                  {project.members.map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
              {err && <p className="error-msg">{err}</p>}
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* add member modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Member</h3>
            <form onSubmit={addMember}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {err && <p className="error-msg">{err}</p>}
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
