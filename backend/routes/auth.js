const express = require('express')
const prisma = require('../src/prisma')

const router = express.Router()

// signup
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'email already in use' })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: role === 'admin' ? 'admin' : 'member'
      }
    })

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    console.log('signup error:', err)
    res.status(500).json({ error: 'something went wrong' })
  }
})

module.exports = router
