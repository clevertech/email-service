const nodemailer = require('nodemailer')
const ses = require('nodemailer-ses-transport')
const sendgrid = require('nodemailer-sendgrid-transport')
const postmark = require('nodemailer-postmark-transport')
const mailgun = require('nodemailer-mailgun-transport')
const stub = require('nodemailer-stub-transport')
const winston = require('winston')

module.exports = env => {
  switch (env('TRANSPORT')) {
    case 'ses':
      const AWS = require('aws-sdk')
      AWS.config.update({
        accessKeyId: env('AWS_KEY'),
        secretAccessKey: env('AWS_SECRET'),
        region: env('AWS_REGION')
      })
      return nodemailer.createTransport(ses({ ses: new AWS.SES() }))
    case 'sendgrid':
      return nodemailer.createTransport(sendgrid({
        auth: {
          api_key: env('SENDGRID_API_KEY')
        }
      }))
    case 'postmark':
      return nodemailer.createTransport(postmark({
        auth: {
          apiKey: env('POSTMARK_API_KEY')
        }
      }))
    case 'mailgun':
      return nodemailer.createTransport(mailgun({
        auth: {
          api_key: env('MAILGUN_API_KEY'),
          domain: env('MAILGUN_DOMAIN')
        }
      }))
    case 'smtp':
      let auth;
      if (env('SMTP_USER') && env('SMTP_PASS')) {
        auth = {
          user: env('SMTP_USER'),
          pass: env('SMTP_PASS')
        };
      }
      const config = {
        host: env('SMTP_HOST'),
        port: env('SMTP_PORT'),
        secure: (env('SMTP_SECURE') == 'true'), // eslint-disable-line eqeqeq
        ignoreTLS: (env('SMTP_SECURE') == 'false'), // eslint-disable-line eqeqeq
      } 
      return nodemailer.createTransport(auth ? config: {...config, auth })
    case 'stub':
      return nodemailer.createTransport(stub())
    default:
      winston.error('No valid TRANSPORT set')
      return nodemailer.createTransport() // direct transport
  }
}
