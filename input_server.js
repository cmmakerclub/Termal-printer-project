const express = require('express')
const app = express()
const port = 3001

var moment = require('moment');
var fs = require('fs');
var textToImage = require('text-to-image');
var format = "YYYY-MM-DD_HH_MM_SS_SSS";
var randomstring = require("randomstring");
var amqp = require('amqplib/callback_api');

app.use(express.static('public'))
app.use(express.static('images'))
app.use(express.static('node_modules/spectrum-colorpicker'))

app.get('/', (req, res) => res.sendFile("index.html"))

app.get('/comment', function (req, res) {

  var comment = req.query.comment;

  if (comment != "")
  {
    textToImage.generate(comment, {
      debug: false,
      maxWidth: 200,
      fontSize: 16,
      fontFamily: 'Arial',
      lineHeight: 30,
      margin: 5,
      bgColor: "#FFFFFF",
      textColor: "black"
    }).then(function (dataUri) {

      var data = dataUri.replace(/^data:image\/\w+;base64,/, "");
      var buf = new Buffer(data, 'base64');

      var imageName = randomstring.generate(4) + "_";
      imageName += moment(new Date()).format(format);

      fs.writeFileSync(__dirname + '/images/' + imageName + '.png', buf);

      SaveToQueue(imageName)
    });
  }

  res.send('OK');
})

app.listen(port, () => console.log(`app listening on port ${port}!`))

function SaveToQueue(fileName)
{
  amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
      var q = 'task_queue';
      var msg = fileName;

      ch.assertQueue(q, {durable: true});
      ch.sendToQueue(q, new Buffer(msg), {persistent: true});
      console.log(" [x] Sent '%s'", msg);
    });
  });
}