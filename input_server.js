const express = require('express')
const app = express()
const port = 3001

var moment = require('moment');
var fs = require('fs');
var textToImage = require('text-to-image');
var format = "YYYY-MM-DD_HH_MM_SS_SSS";
var randomstring = require("randomstring");
var amqp = require('amqplib/callback_api');
var bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '50mb'})); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })); // support encoded bodies
app.use(express.static('public'))
app.use(express.static('images'))
app.use(express.static('node_modules/socket.io-client/dist'))
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

      var imageName = moment(new Date()).format(format) + "_";
      imageName += randomstring.generate(4);

      fs.writeFileSync(__dirname + '/images/' + imageName + '.png', buf);

      SaveToQueue(imageName)
    });
  }

  res.send('OK');
})

app.post('/print_image_64', function (req, res) {

  var image = req.body.image_64;

  if (image != "")
  {
    var data = new Buffer(image, 'base64');

    var imageName = moment(new Date()).format(format) + "_";
    imageName += randomstring.generate(4);


    fs.writeFileSync(__dirname + '/images/' + imageName + '.png', data);
    SaveToQueue(imageName)
    res.send('OK');
  }
  else 
  {
    res.send('Fail');
  }
  
})

var server = app.listen(port, () => console.log(`app listening on port ${port}!`))
var io = require('socket.io')(server);

io.on('connection', function (socket) {
  socket.on('new comment', function (data) {
    socket.broadcast.emit('comment', data);
    console.log(data);
  });
});

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