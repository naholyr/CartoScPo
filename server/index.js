const path = require('path')
const debug = require('debug')('express')
const express = require('express')
const boom = require('express-boom')
const { server: config } = require('config')

const PUBLIC = path.join(__dirname, '../back-office')
const DB = path.join(__dirname, '../app/data/data.json')

const db = require(DB)

const app = express()

app.use(express.static(PUBLIC))
app.use(express.json())
app.use(boom())

app.get('/api/centers/:id', ({ params }, res) => {
  const center = db.allCenters[params.id]
  if (!center) return res.boom.notFound()

  center.id = params.id
  res.json({ center })
})

app.get('/api/centers', (req, res) => {
  const centers = Array.from(Object.entries(db.allCenters)).map(
    ([id, center]) => {
      center.id = id
      return center
    },
  )
  res.json({ centers })
})

app.put('/api/centers/:id', ({ params, body }, res) => {
  if (!db.allCenters[params.id]) return res.boom.notFound()
  db.allCenters[params.id] = body.center
  res.send('ok')
})

// single page application
app.get('/*', (req, res) => res.sendFile(`${PUBLIC}/index.html`))

app.listen(config.port, () => debug(`Server listening on ${config.port}`))
