// BeepBoop Teams API wrapper
// TODO: Pull this into it's own module, beepboop-teams or a generic beepboop-api
const Wreck = require('wreck')
const url = require('url')

module.exports = function serviceProvider (config) {
  if (!config) throw new Error('Must set config for teams api')
  if (!config.token) throw new Error('Must set token for teams api')
  if (!config.url) throw new Error('Must set url for teams api')

  let wreck = Wreck.defaults({
    baseUrl: config.url,
    headers: { 'Authorization': 'Bearer ' + config.token },
    timeout: 10000
  })

  return {
    create (payload, cb) {
      let headers = { 'Content-Type': 'application/json' }

      wreck.request('POST', '/slack-teams', { payload, headers }, (err, res) => {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null, null)

        wreck.read(res, {json: true}, (err, body) => {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body && body.error))
          if (res.statusCode !== 200) return cb(new Error('Unexpected response (' + res.statusCode + ')'))

          cb(null, body)
        })
      })
    },
    get (slackTeamId, cb) {
      wreck.request('GET', `/slack-teams/${slackTeamId}`, null, (err, res) => {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null, undefined)

        wreck.read(res, {json: true}, (err, body) => {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body && body.error))
          if (res.statusCode !== 200) return cb(new Error('Unexpected response (' + res.statusCode + ')'))

          cb(null, body)
        })
      })
    },
    list (query, cb) {
      if (typeof query === 'function') {
        cb = query
        query = {}
      }

      let reqUrl = {
        query,
        pathname: '/slack-teams'
      }

      wreck.request('GET', url.format(reqUrl), null, (err, res) => {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null, [])

        wreck.read(res, {json: true}, (err, body) => {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body && body.error))
          if (res.statusCode !== 200) return cb(new Error('Unexpected response (' + res.statusCode + ')'))

          cb(null, body)
        })
      })
    },
    del (slackTeamId, cb) {
      wreck.request('DELETE', `/slack-teams/${slackTeamId}`, null, (err, res) => {
        if (err) return cb(err)
        if (res.statusCode === 404) return cb(null)
        if (res.statusCode === 200) return cb(null)

        wreck.read(res, {json: true}, (err, body) => {
          if (err) return cb(err)
          if (res.statusCode === 500 || res.statusCode === 400) return cb(new Error(body && body.error))

          cb(new Error('Unexpected response (' + res.statusCode + ')'))
        })
      })
    }
  }
}
