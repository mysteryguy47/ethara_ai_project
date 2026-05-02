require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const projectRoutes = require('./routes/projects')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'taskflow api is running' })
})

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})
