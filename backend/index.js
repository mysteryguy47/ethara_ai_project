require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'taskflow api is running' })
})

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})
