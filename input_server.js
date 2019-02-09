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
var fileAsImage = "_image_";
var fileAsText = "_text_";
var imageDir = __dirname + "/images/";
var publicDir = "public";

app.use(bodyParser.json({limit: '50mb'})); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })); // support encoded bodies
app.use(express.static(publicDir))
app.use(express.static('images'))
app.use(express.static('node_modules/socket.io-client/dist'))
app.use(express.static('node_modules/spectrum-colorpicker'))

app.get('/', (req, res) => res.sendFile("index.html"));
app.get('/picture', (req, res) => res.sendFile(__dirname + "/" + publicDir + "/" + "list.html"));

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

      var imageName = moment(new Date()).format(format) + fileAsText;
      imageName += randomstring.generate(4) + ".png";

      fs.writeFileSync(imageDir + imageName, buf);

      SaveToQueue(imageName)
    });
  }

  res.send('OK');
})

app.get('/images_latest', function (req, res) {

  // TODO add filter by page 
  var max = 20;
  var page = req.query.page;

  if (typeof page == "undefined")
  {
    page = 1;
  }

  fs.readdir(imageDir, (err, files) => {
    files.sort(function(a, b) {
               return fs.statSync(imageDir + a).mtime.getTime() - 
                      fs.statSync(imageDir + b).mtime.getTime();
           });


    files = files.filter(e => {return e.indexOf("image") != -1});
    files = files.reverse();
    res.send(files[0]);
  });
})

app.get('/images_all', function (req, res) {

  var max = 30;
  var page = req.query.page;

  if (typeof page == "undefined")
  {
    page = 1;
  }

  fs.readdir(imageDir, (err, files) => {

    files.sort(function(a, b) {
               return fs.statSync(imageDir + a).mtime.getTime() - 
                      fs.statSync(imageDir + b).mtime.getTime();
           });


    files = files.filter(e => {return e.indexOf("image") != -1});

    files = files.reverse();

    if (files.length > max)
    {
      files = files.slice(0, max)
    }

    res.send(files);
  });
})

app.post('/print_image_64', function (req, res) {

  var image = req.body.image_64;

  if (image != "")
  {
    var data = new Buffer(image, 'base64');

    var imageName = moment(new Date()).format(format) + fileAsImage;
    imageName += randomstring.generate(4) + ".png";

    fs.writeFileSync(imageDir + imageName, data);
    SaveToQueue(imageName)
    io.emit('new image', imageName);
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