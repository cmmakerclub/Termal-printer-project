const request = require('request');
const express = require('express');
const line = require('@line/bot-sdk');
const config = require('config');
const lineConfig = config.get('line');
const lineToken = {
    channelAccessToken: process.env.channelAccessToken || lineConfig.channelAccessToken,
    channelSecret: process.env.channelSecret || lineConfig.channelSecret
};
const printUrl = process.env.apiImageUrl || config.apiImageUrl;


const client = new line.Client(lineToken);

var currentImage = [];

const app = express();

app.get('/image', function (req, res) {
  var z = currentImage.toString('base64');
  res.send(z)
})

app.post('/webhook', line.middleware(lineToken), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

function handleEvent(event) {

  console.log(event);
  if (event.type === 'message' && event.message.type === 'text') 
  {
    return Promise.resolve(null);
    handleMessageEvent(event);
  } 
  else if (event.type === 'message' && event.message.type === 'image') {
    handleImageEvent(event)
  }
  else 
  {
    return Promise.resolve(null);
  }
}

function handleImageEvent(event) {
  var message = event.message;
  var chunks = [];
  client.getMessageContent(message.id)
    .then((stream) => {
      stream.on('data', (chunk) => {
        chunks.push(chunk);
        // console.log(chunks);
      });

      stream.on('end', () => {
        var body = Buffer.concat(chunks);
        
        var msg = {
          type: 'text',
          text: 'อ่านรูปแล้วนะ กำลังส่งไปปริ้นแหล่ะ'
        };
        currentImage = body;
        
        var messageSend = [];
        messageSend.push(msg);
        var string_data = body.toString('base64');

        request.post(printUrl, {form:{image_64: string_data}},

          function(err, httpResponse, body) 
          { 

            var readingMessage = {
              type: 'text',
              text: 'ปริ้นรูปแล้วน้าา'
            };

            var errorMessage = {
              type: 'text',
              text: 'เหมือนจะปริ้นไม่ไ้ดนะ'
            };

            if (!err)
            {
              messageSend.push(readingMessage);
              return client.replyMessage(event.replyToken, messageSend);
            }
            else 
            {
              messageSend.push(errorMessage);
              return client.replyMessage(event.replyToken, messageSend);
            }

          });
        
      });

      stream.on('error', (err) => {
        // error handling
      });
    });
}

function handleMessageEvent(event) {
  var msg = {
    type: 'text',
    text: 'ส่งรูปมาเลยจ้า'
  };

  return client.replyMessage(event.replyToken, msg);
}

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function () {
    console.log('run at port', app.get('port'));
});

