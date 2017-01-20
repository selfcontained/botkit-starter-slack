module.exports = function(webserver, controller) {
    var seen = {}
    webserver.use(function (req, res, next) {
        // console.log(req.headers)
        var id = req.headers['bb-slackteamid']
        if (seen[id]) return next()
        var data = {
            id: id,
            createdBy: req.headers['bb-slackbotuserid'],
            name: req.headers['bb-slackteamname'],
            bot: {
                token: req.headers['bb-slackbotaccesstoken'],
                user_id: req.headers['bb-slackbotuserid'],
                createdBy: req.headers['bb-slackbotuserid'],
                app_token: req.headers['bb-slackaccesstoken'],
                name: req.headers['bb-slackbotusername']
            }
        }
        controller.storage.teams.save(data, function (err) {
            if (!err) seen[id] = true
            next(err)
        })
    })
}