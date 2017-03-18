const fetch = require('node-fetch')
const baseURL = `http://127.0.0.1:${process.env.PORT}`

require('../').standaloneApp()

module.exports = (path, options) => {
  const body = options && options.body
  if (Object.prototype.toString.call(body) === '[object Object]') {
    options.body = JSON.stringify(body)
    options.headers = Object.assign({}, options.headers, {
      'Content-Type': 'application/json'
    })
  }
  return fetch(baseURL + path, options)
}
