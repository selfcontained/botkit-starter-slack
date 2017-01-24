const deap = require('deap')
const Persist = require('beepboop-persist')
const Teams = require('./teams')

module.exports = function (config) {
  var persist = Persist()
  var bbTeams = Teams({
    token: process.env.BEEPBOOP_TOKEN,
    url: process.env.BEEPBOOP_PERSIST_URL
  })

  var storage = {
    teams: {
      get (teamId, cb) {
        if (!teamId) {
          return cb(new Error('Missing teamId in storage.teams.get()'))
        }

        // load slack team data from teams api and overlay it onto any data stored in persist
        bbTeams.get(teamId, (err, team) => {
          if (err) {
            return cb(err)
          }

          if (!team) {
            return cb(new Error(`No team found for team id ${teamId}`))
          }

          persist.get(teamKey(teamId), (err, teamData) => {
            if (err) {
              return cb(err)
            }

            // overlay botkit team onto custom team meta-data
            cb(null, deap(teamData || {}, bbTeamToBotkitTeam(team)))
          })
        })
      },
      // Stores additional team metadata in persist
      save (team, cb) {
        if (!team || !team.id) {
          return cb(new Error('Missing team.id in storage.teams.save()'))
        }

        persist.set(teamKey(team.id), team, cb)
      },
      // Deletes team data in persist
      delete (teamId, cb) {
        persist.del(teamKey(teamId), cb)
      },
      all (cb) {
        // TODO: currently this will only grab the first 1000 teams - need to make paginated calls
        // First get all of the installed teams from Beep Boop
        bbTeams.list((err, teams) => {
          if (err) {
            return cb(err)
          }

          let teamKeys = teams.map(team => teamKey(team.slack_team_id))

          // Next get any metadata saved for each team
          persist.mget(teamKeys, (err, teamsData) => {
            if (err) {
              return cb(err)
            }

            // merge team metadata w/ beep boop teams and transform to botkit team
            // indexes between two should be the same
            let botkitTeams = teamsData.map((teamData, idx) => {
              return deap(teamData || {}, bbTeamToBotkitTeam(teams[idx]))
            })

            cb(null, botkitTeams)
          })
        })
      }
    },
    users: {
      get (userId, cb) {
        persist.get(userKey(userId), cb)
      },
      save (user, cb) {
        persist.set(userKey(user.id), user, cb)
      },
      delete (userId, cb) {
        persist.del(userKey(userId), cb)
      },
      all (cb) {
        // get all the user keys
        persist.list('users/', (err, keys) => {
          if (err) {
            return cb(err)
          }

          persist.mget(keys, cb)
        })
      }
    },
    channels: {
      get (channelId, cb) {
        persist.get(channelKey(channelId), cb)
      },
      save (channel, cb) {
        persist.set(channelKey(channel.id), channel, cb)
      },
      delete (channelId, cb) {
        persist.del(channelKey(channelId), cb)
      },
      all (cb) {
        // get all the channel keys
        persist.list('channels/', (err, keys) => {
          if (err) {
            return cb(err)
          }

          persist.mget(keys, cb)
        })
      }
    }
  }

  return storage
}

function teamKey (id) {
  return `teams:${id}`
}

function userKey (id) {
  return `users:${id}`
}

function channelKey (id) {
  return `channels:${id}`
}

// transform beep boop team into what botkit expects
function bbTeamToBotkitTeam (team) {
  return {
    id: team.slack_team_id,
    createdBy: team.slack_user_id,
    url: `https://${team.slack_team_domain}.slack.com/`,
    name: team.slack_team_name,
    bot: {
      name: team.slack_bot_user_name,
      token: team.slack_bot_access_token,
      user_id: team.slack_bot_user_id,
      createdBy: team.slack_user_id,
      app_token: team.slack_access_token
    }
  }
}
