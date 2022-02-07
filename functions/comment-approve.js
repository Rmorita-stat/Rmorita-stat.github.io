var request = require("request")

function purgeComment(id) {
  var url = `https://api.netlify.com/api/v1/submissions/${id}?access_token=${process.env.NETLIFY_AUTH_TOKEN}`
  request.delete(url, function (err, response, body) {
    if (err) {
      return console.log(err)
    } else {
      return console.log("Comment deleted from queue.")
    }
  })
}

exports.handler = function (event, context, callback) {
  const body = event.body.split("payload=")[1]
  const payload = JSON.parse(unescape(body))
  const method = payload.actions[0].name
  const id = payload.actions[0].value

  if (method == "delete") {
    purgeComment(id)
    callback(null, {
      statusCode: 200,
      body: "Comment deleted"
    })
  } else if (method == "approve") {
    const url = `https://api.netlify.com/api/v1/submissions/${id}?access_token=${process.env.NETLIFY_AUTH_TOKEN}`

    request(url, function (err, response, body) {
      if (!err && response.statusCode === 200) {
        const data = JSON.parse(body).data

        // now we have the data, let's massage it and post it to the approved form
        const payload = {
          'form-name': "sampleApprovedComments",
          'path': data.path,
          'received': new Date(),
          'email': data.email,
          'name': data.name,
          'content': data.content
        }
        const approvedURL = process.env.URL

        console.log("Posting to", approvedURL)
        console.log(payload)

        request.post({
          url: approvedURL,
          headers: {
            "Content-type": "application/x-www-form-urlencoded",
          },
          form: payload
        }, function (err, httpResponse, body) {
          let msg
          if (err) {
            msg = 'Post to approved comments failed:' + err
            console.log(msg)
          } else {
            msg = 'Post to approved comments list successful.'
            console.log(msg)
            purgeComment(id)
          }
          msg = "Comment registered. Site deploying to include it."
          callback(null, {
            statusCode: 200,
            body: msg
          })
          return console.log(msg)
        })
      }
    })
  }
}
