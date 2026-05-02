const express = require('express')
const prisma = require('../src/prisma')
const verifyToken = require('../src/middleware/auth')
const { requireProjectRole } = require('../src/middleware/project')

const router = express.Router()

// get all projects for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } }
          }
        }
      }
    })

    const projects = memberships.map(m => ({
      ...m.project,
      myRole: m.role
    }))

    res.json(projects)
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch projects' })
  }
})

// create project
router.post('/', verifyToken, async (req, res) => {
  const { name, description } = req.body

  if (!name) {
    return res.status(400).json({ error: 'project name is required' })
  }

  try {
    // create project and add creator as admin in one transaction
    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: { name, description }
      })

      await tx.projectMember.create({
        data: {
          userId: req.user.id,
          projectId: p.id,
          role: 'admin'
        }
      })

      return p
    })

    res.status(201).json(project)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'could not create project' })
  }
})

// get single project
router.get('/:id', verifyToken, requireProjectRole('member'), async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    res.json(project)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// add member to project (admin only)
router.post('/:id/members', verifyToken, requireProjectRole('admin'), async (req, res) => {
  const { email, role } = req.body

  try {
    const userToAdd = await prisma.user.findUnique({ where: { email } })
    if (!userToAdd) {
      return res.status(404).json({ error: 'user not found' })
    }

    const projectId = parseInt(req.params.id)

    // check if already a member
    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userToAdd.id, projectId } }
    })

    if (existing) {
      return res.status(400).json({ error: 'user is already in this project' })
    }

    const member = await prisma.projectMember.create({
      data: {
        userId: userToAdd.id,
        projectId,
        role: role === 'admin' ? 'admin' : 'member'
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    })

    res.status(201).json(member)
  } catch (err) {
    res.status(500).json({ error: 'could not add member' })
  }
})

// delete project
router.delete('/:id', verifyToken, requireProjectRole('admin'), async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'project deleted' })
  } catch (err) {
    res.status(500).json({ error: 'delete failed' })
  }
})

module.exports = router
