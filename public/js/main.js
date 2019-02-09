requirejs.config({
    baseUrl: 'js',
});

require(['nico', 'jquery', 'spectrum'], function (foo) {

  var socket = io.connect(document.URL);
  socket.on('comment', function (data) {
    nico.send(data.comment, data.color);
  });

  socket.on('new image', function (data) {
    $('body').css('background-image', 'url(' + window.location.protocol + "/" + data + ')');
  });

  var w = window.outerWidth;
  var h = window.innerHeight;

  let nico = new nicoJS({
      app       : document.getElementById('app'),
      width     : w,
      height    : h,
      font_size : 60,     // opt
      color     : '#fff'  // opt
  })

  nico.listen();

  window.onresize = function(event) {
    var w = window.outerWidth;
    var h = window.innerHeight;
    nico.width = w;
    nico.height = h;
  };

  $("#comment_enter").click(function()
  {
    var comment = $("#comment");
    var text = comment.val();
    if (text != "")
    {
      var color = $("#custom").spectrum("get").toHexString();
      var jqxhr = $.get( "comment", { comment: text, color: color}, function(aData) {

      })
      .done(function(data) {
        socket.emit('new comment', { comment: text, color: color});
      })
      .fail(function() {
        
      })
      .always(function() {
        nico.send(text, color);
        comment.val("");
      });

    }
  })

  var bgImage = $.get("images_latest", {}, function(aData) {
  })
  .done(function(data) {
    $('body').css('background-image', 'url(' + window.location.protocol + "/" + data + ')');
  })
  .fail(function() {
    
  })
  .always(function() {
  });

  $("#custom").spectrum({
    color: "#fff"
  });

});



