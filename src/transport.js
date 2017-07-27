module.exports = env => {
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
  winston.error('No valid TRANSPORT set')
  return nodemailer.createTransport() // direct transport
}
