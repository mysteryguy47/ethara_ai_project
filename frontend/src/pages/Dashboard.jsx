import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Navbar from '../components/Navbar'
import '../App.css'

function statusBadge(status, dueDate) {
  const overdue = dueDate && status !== 'done' && new Date(dueDate) < new Date()
  if (overdue) return <span className="badge badge-overdue">overdue</span>
  if (status === 'done') return <span className="badge badge-done">done</span>
  if (status === 'in-progress') return <span className="badge badge-progress">in progress</span>
  return <span className="badge badge-todo">todo</span>
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.log(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <><Navbar /><div className="page">Loading...</div></>

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>

        <div className="stats-row">
          <div className="stat-box">
            <div className="num">{stats?.totalProjects ?? 0}</div>
            <div className="label">Projects</div>
          </div>
          <div className="stat-box">
            <div className="num">{stats?.taskStats?.total ?? 0}</div>
            <div className="label">Total Tasks</div>
          </div>
          <div className="stat-box">
            <div className="num">{stats?.taskStats?.inProgress ?? 0}</div>
            <div className="label">In Progress</div>
          </div>
          <div className="stat-box">
            <div className="num">{stats?.taskStats?.done ?? 0}</div>
            <div className="label">Done</div>
          </div>
          <div className="stat-box">
            <div className="num" style={{ color: stats?.overdueCount > 0 ? '#de350b' : undefined }}>
              {stats?.overdueCount ?? 0}
            </div>
            <div className="label">Overdue</div>
          </div>
        </div>

        {stats?.overdueCount > 0 && (
          <>
            <div className="section-title">Overdue Tasks</div>
            <ul className="task-list" style={{ marginBottom: 24 }}>
              {stats.overdueTasks.map(t => (
                <li key={t.id} className="task-item">
                  <div>
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">due {new Date(t.dueDate).toLocaleDateString()}</div>
                  </div>
                  <span className="badge badge-overdue">overdue</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="section-title">My Assigned Tasks</div>
        {stats?.myTasks?.length === 0 && (
          <p style={{ fontSize: 14, color: '#5e6c84' }}>No tasks assigned to you yet.</p>
        )}
        <ul className="task-list">
          {stats?.myTasks?.map(t => (
            <li key={t.id} className="task-item">
              <div>
                <div className="task-title">{t.title}</div>
                <div className="task-meta">
                  {t.project?.name} {t.dueDate && `· due ${new Date(t.dueDate).toLocaleDateString()}`}
                </div>
              </div>
              {statusBadge(t.status, t.dueDate)}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
