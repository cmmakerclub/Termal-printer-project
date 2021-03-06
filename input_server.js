const express = require('express');
const app = express();
const port = 3001;

var Jimp = require('jimp');
var multer  = require('multer');
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

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://mqtt.cmmc.io')
var lcdNumber = 1;

var storage = multer.diskStorage({
  destination: imageDir,
  // filename: function (req, file, cb) {
  //   cb(null, moment(new Date()).format(format) + file.fieldname)
  // }
  filename: moment(new Date()).format(format) + fileAsImage + randomstring.generate(4)
})

var upload = multer(storage);

app.use(bodyParser.json({limit: '50mb'})); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })); // support encoded bodies
app.use(express.static(publicDir))
app.use(express.static('images'))
app.use(express.static('node_modules/socket.io-client/dist'))
app.use(express.static('node_modules/spectrum-colorpicker'))

app.get('/', (req, res) => res.sendFile("index.html"));
app.get('/upload_picture', (req, res) => res.sendFile(__dirname + "/" + publicDir + "/" + "upload.html"));
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

app.post('/upload_picture', upload.single('avatar'), function(req, res) {

  if (!req.file)
  {
    console.log("Error");
    res.send('Error');
  }
  else 
  {
    console.log('upload ok')
    var imageName = moment(new Date()).format(format) + fileAsImage;
    imageName += randomstring.generate(4) + ".png";

    var imagePath = imageDir + imageName;
    fs.writeFileSync(imagePath, req.file.buffer);
    SaveToQueue(imageName);
    SendDataToDisplay(imagePath);
    io.emit('new image', imageName);
    res.send('OK');
  }
})

app.get('/images_latest', function (req, res) {

  // TODO add filter by page 
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

  var max = 40;
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

    var imagePath = imageDir + imageName;
    fs.writeFileSync(imagePath, data);
    SaveToQueue(imageName)
    SendDataToDisplay(imagePath)
    io.emit('new image', imageName);
    res.send('OK');
  }
  else 
  {
    res.send('Fail');
  }
  
})

app.get('/firer', function (req, res) {

  var ledTopic = "TECH_FEST/LED_STRIP_00";
  var commandFirer = "/$/firer";

  for (var i = 0; i < 6; i++)
  {
    client.publish(ledTopic + commandFirer, "Firer");
  }

  var cloudTopic = "TECH_FEST/CLOUD_00";

  for (var i = 1; i < 4; i++)
  {
    client.publish(cloudTopic + commandFirer, "Firer");
  }

  res.send('OK');
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

function SendDataToDisplay(imagePath)
{
  var listData = "";
  Jimp.read(imagePath)
    .then(gray_image => {
      return gray_image
        .resize(128, 64, Jimp.RESIZE_HERMITE) // resize
        .quality(40) // set JPEG quality
        .greyscale() // set greyscale
        
    })
    .then(image => {

      listData = "";

      return image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
        // x, y is the position of this pixel on the image
        // idx is the position start position of this rgba tuple in the bitmap Buffer
        // this is the image
   

        var red = this.bitmap.data[idx + 0];
        var green = this.bitmap.data[idx + 1];
        var blue = this.bitmap.data[idx + 2];
        var alpha = this.bitmap.data[idx + 3];
       
        if (red + green + blue > (255/2 + 255/2 + 255.0/2))
        {
          // this.bitmap.data[idx + 0] = 255;
          // this.bitmap.data[idx + 1] = 255;
          // this.bitmap.data[idx + 2] = 255;

          listData += "0";
        }
        else
        {
          // this.bitmap.data[idx + 0] = 0;
          // this.bitmap.data[idx + 1] = 0;
          // this.bitmap.data[idx + 2] = 0;
          listData += "1";
        }

        // rgba values run from 0 - 255
        // e.g. this.bitmap.data[idx] = 0; // removes red from this pixel
      })
    })
    .then(image => {

      var hex = "";
      var hexOutput = "";
      for (var i = 0; i < (128 * 64); i += 4)
      {
        hex = "";
        for (var j = 0; j < 4; j++)
        {
          var index = i + j;
          hex += listData[i + j];
        }

        var hexString = parseInt(hex, 2).toString(16).toUpperCase();

        hexOutput += hexString;
      }

      // console.log(hexOutput)
      var topicLCD = 'TECH_FEST/LCD_PICTURE_00' + lcdNumber + "/$/command";
      client.publish(topicLCD, hexOutput)
      console.log('send data to topic topicLCD')
      lcdNumber++;
      if (lcdNumber > 3)
      {
        lcdNumber = 1;
      }
    })
    .catch(err => {
      console.error(err);
    });
}