#!/usr/bin/env node

const express = require('express')
const bodyParser = require('body-parser')
const winston = require('winston')

const Joi = require('joi')

const schema = Joi.object().keys({
  templateName: Joi.string().required(),
  templateOptions: Joi.object().required(),
  emailOptions: Joi.object().required(),
  language: Joi.string()
})

exports.createRouter = (config = {}) => {
  const env = require('./utils/env')(config)
  const service = require('./email')(env)

  const router = express.Router()
  router.use(bodyParser.json({}))
  router.post('/send', (req, res, next) => {
    const { body } = req
    const result = Joi.validate(body, schema)
    if (result.error) {
      return res.status(400).json({
        error: result.error.message || String(result.error)
      })
    }
    const {
      emailOptions,
      templateName,
      templateOptions,
      language
    } = req.body
    service.sendTemplatedEmail(emailOptions, templateName, templateOptions, language)
      .then(response => res.json(response))
      .catch(err => res.status(500).json({ error: err.message || String(err) }))
  })
  return router
}

exports.startServer = (config, callback) => {
  const env = require('./utils/env')(config)
  const app = express()
  const router = exports.createRouter(config)
  const port = +env('MICROSERVICE_PORT') || 0

  app.use('/email', router)

  app.get('/healthz', (req, res) => {
    res.status(200).send({ 'status': 'OK' })
  })

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain')
    const pattern = process.env.ROBOTS_INDEX === 'true' ? '' : ' /'
    res.send(`User-agent: *\nDisallow:${pattern}\n`)
  })

  return app.listen(port, callback)
}

if (require.main === module) {
  const server = exports.startServer({}, () => {
    const address = server.address()
    winston.info('NODE_ENV: ' + process.env.NODE_ENV)
    winston.info(`Listening on port ${address.port}! Send an HTTP POST to http://${address.address}:${address.port}/email/send for sending an email`)
  })
}
