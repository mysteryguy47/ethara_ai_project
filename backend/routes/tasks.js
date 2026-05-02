const express = require('express')
const prisma = require('../src/prisma')
const verifyToken = require('../src/middleware/auth')
const { requireProjectRole } = require('../src/middleware/project')

const router = express.Router()

// get tasks for a project
router.get('/project/:projectId', verifyToken, requireProjectRole('member'), async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: parseInt(req.params.projectId) },
      include: {
        assignee: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: 'could not fetch tasks' })
  }
})

// create task
router.post('/project/:projectId', verifyToken, requireProjectRole('member'), async (req, res) => {
  const { title, description, assignedTo, dueDate } = req.body
  const projectId = parseInt(req.params.projectId)

  if (!title) {
    return res.status(400).json({ error: 'title is required' })
  }

  try {
    // if assigning to someone, make sure they're actually in the project
    if (assignedTo) {
      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: assignedTo, projectId } }
      })
      if (!isMember) {
        return res.status(400).json({ error: 'assigned user is not in this project' })
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assignedTo: assignedTo || null,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        assignee: { select: { id: true, name: true } }
      }
    })

    res.status(201).json(task)
  } catch (err) {
    console.log('create task err:', err.message)
    res.status(500).json({ error: 'failed to create task' })
  }
})

// update task (status, title, assignee, dueDate)
router.put('/:id', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.id)
  const { title, description, status, assignedTo, dueDate } = req.body

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return res.status(404).json({ error: 'task not found' })

    // check user is part of the project
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } }
    })
    if (!membership) return res.status(403).json({ error: 'access denied' })

    const validStatuses = ['todo', 'in-progress', 'done']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'invalid status value' })
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
      },
      include: {
        assignee: { select: { id: true, name: true } }
      }
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// delete task - only project admins
router.delete('/:id', verifyToken, async (req, res) => {
  const taskId = parseInt(req.params.id)

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return res.status(404).json({ error: 'task not found' })

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } }
    })

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'only admins can delete tasks' })
    }

    await prisma.task.delete({ where: { id: taskId } })
    res.json({ message: 'task deleted' })
  } catch (err) {
    res.status(500).json({ error: 'delete failed' })
  }
})

module.exports = router
