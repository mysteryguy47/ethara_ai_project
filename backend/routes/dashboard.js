const express = require('express')
const prisma = require('../src/prisma')
const verifyToken = require('../src/middleware/auth')

const router = express.Router()

// main dashboard - summary for the logged in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const now = new Date()

    // get all projects this user is part of
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    })
    const projectIds = memberships.map(m => m.projectId)

    // tasks assigned to me
    const myTasks = await prisma.task.findMany({
      where: { assignedTo: userId },
      include: {
        project: { select: { id: true, name: true } }
      }
    })

    // all tasks across my projects
    const allTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } }
    })

    const todo = allTasks.filter(t => t.status === 'todo').length
    const inProgress = allTasks.filter(t => t.status === 'in-progress').length
    const done = allTasks.filter(t => t.status === 'done').length

    // overdue = has a due date, not done, and due date is in the past
    const overdue = allTasks.filter(t =>
      t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now
    )

    res.json({
      totalProjects: projectIds.length,
      taskStats: { todo, inProgress, done, total: allTasks.length },
      overdueCount: overdue.length,
      overdueTasks: overdue.slice(0, 5), // just show first 5
      myTasks: myTasks.slice(0, 10)
    })
  } catch (err) {
    res.status(500).json({ error: 'dashboard fetch failed' })
  }
})

module.exports = router
