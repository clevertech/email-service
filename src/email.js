const nodemailer = require('nodemailer')
const ses = require('nodemailer-ses-transport')
const stub = require('nodemailer-stub-transport')
const AWS = require('aws-sdk')
const juice = require('juice')
const pug = require('pug')
const ejs = require('ejs')
const path = require('path')
const fs = require('fs')
const winston = require('winston')

const createTransport = env => {
  const transport = env('TRANSPORT')
  if (transport === 'ses') {
    AWS.config.update({
      accessKeyId: env('AWS_KEY'),
      secretAccessKey: env('AWS_SECRET'),
      region: env('AWS_REGION')
    })
    return nodemailer.createTransport(ses({ ses: new AWS.SES() }))
  }
  if (transport === 'stub') {
    return nodemailer.createTransport(stub())
  }
  if (transport === 'smtp') {
    let smtpConfig = {
        host: env('SMTP_HOST'),
        port: env('SMTP_PORT'),
        secure: (env('SMTP_SECURE') == 'true'), // use TLS,
        ignoreTLS:  (env('SMTP_SECURE') == 'false'), // use TLS
        auth: {
            user: env('SMTP_USER'),
            pass: env('SMTP_PASS')
        }
    };
    
    return nodemailer.createTransport(smtpConfig);
  }
  winston.error('No valid TRANSPORT set')
  return nodemailer.createTransport() // direct transport
}

module.exports = env => {
  const defaultLanguage = env('DEFAULT_LANGUAGE', 'en')
  const defaultEmailFrom = env('DEFAULT_FROM')
  const templatesDir = env('TEMPLATES_DIR')
  const transporter = createTransport(env)
  const service = {}

  const fullPath = relativePath => path.join(templatesDir, relativePath)

  const fileExists = fullPath => new Promise((resolve, reject) => {
    if (!fullPath.startsWith(templatesDir + path.sep)) return reject(new Error('Invalid template path'))
    fs.access(fullPath, fs.constants.R_OK, err => resolve(!err))
  })

  const renderEjs = (filename, data) => new Promise((resolve, reject) => {
    ejs.renderFile(filename, data, {}, (err, str) => {
      err ? reject(err) : resolve(str)
    })
  })

  const renderPug = (filename, data) => new Promise((resolve, reject) => {
    resolve(pug.renderFile(filename, data))
  })

  const processIfExists = (filename, data, func) => fileExists(filename).then(exists => exists ? func(filename, data) : void 0)

  service.processTemplate = (template, templateOptions, lang = defaultLanguage) => {
    const pathEjsHtmlBody = fullPath(`${lang}/${template}-body-html.ejs`)
    const pathPugHtmlBody = fullPath(`${lang}/${template}-body-html.pug`)
    const pathEjsTextBody = fullPath(`${lang}/${template}-body-text.ejs`)
    const pathEjsSubject = fullPath(`${lang}/${template}-subject.ejs`)

    return Promise.all([
      processIfExists(pathEjsHtmlBody, templateOptions, renderEjs),
      processIfExists(pathPugHtmlBody, templateOptions, renderPug),
      processIfExists(pathEjsTextBody, templateOptions, renderEjs),
      processIfExists(pathEjsSubject, templateOptions, renderEjs)
    ])
    .then(([ejsHtmlBody, pugHtmlBody, ejsTextBody, ejsSubject]) => {
      return {
        subject: (ejsSubject || '').trim(),
        html: juice(ejsHtmlBody || pugHtmlBody || ''),
        text: ejsTextBody
      }
    })
  }

  /*
  // Available mailOptions
  const mailOptions = {
    from: 'Fred Foo ✔ <foo@blurdybloop.com>', // sender address
    to: 'bar@blurdybloop.com, baz@blurdybloop.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world ✔', // plaintext body
    html: '<b>Hello world ✔</b>' // html body
  };
  */
  service.sendMail = (mailOptions) => {
    mailOptions.from = mailOptions.from || defaultEmailFrom
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          reject(err)
          return winston.error(err)
        }
        resolve(info)
      })
    })
  }

  service.sendTemplatedEmail = (mailOptions, template, templateOptions, lang) => {
    return service.processTemplate(template, templateOptions, lang)
      .then(opts => {
        const options = Object.assign({}, mailOptions, opts)
        return service.sendMail(options)
      })
  }

  return service
}
