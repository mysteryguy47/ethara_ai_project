const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const projectRoutes = require('./routes/projects')
const taskRoutes = require('./routes/tasks')
const dashboardRoutes = require('./routes/dashboard')

const app = express()

// had cors issues on Railway without specifying origin
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/dashboard', dashboardRoutes)

// serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
  })
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'taskflow api is running' })
  })
}

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})
