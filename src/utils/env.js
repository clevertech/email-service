const prefix = 'EMAIL_'
const defaults = {}

module.exports = (env = {}) => (key, defaultValue) => {
  return [
    env[prefix + key],
    env[key],
    process.env[prefix + key],
    process.env[key],
    defaultValue,
    defaults[key]
  ].find(value => value != null)
}
