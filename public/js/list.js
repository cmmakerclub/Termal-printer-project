
$(document).ready(function() {

  var macyInstance = Macy({
    container: '.grid',
    trueOrder: true,
    waitForImages: false,
    mobileFirst: true,
  });

  function Recalculate()
  {
    setTimeout(function(){
      $(window).trigger('resize');
      macyInstance.recalculate(true, true);
    }, 330)
  }


  var socket = io.connect(window.location.host);
  socket.on('new image', function (data) {
    var row = "<div class=\"grid-item\"><img src=\"" + window.location.protocol + "/" + data + "\"</img></div>";
    $('.grid').prepend(row);
    Recalculate();
  });

  var jqxhr = $.get("images_all", {}, function(aData) {
  })
  .done(function(data) {
    for (var i = 0; i < data.length; i++)
    {
      var row = "<div class=\"grid-item\"><img src=\"" + window.location.protocol + "/" + data[i] + "\"</img></div>";
      $('.grid').append(row);
    }

  })
  .fail(function() {
    
  })
  .always(function() {
    Recalculate();
  });
});