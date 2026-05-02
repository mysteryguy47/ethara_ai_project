const express = require('express')
const bcrypt = require('bcryptjs')
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

    // 10 rounds is fine for this, no need for more
    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
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
