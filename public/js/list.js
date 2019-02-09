
$(document).ready(function() {
  var socket = io.connect(window.location.host);
  socket.on('new image', function (data) {
    var row = "<div class=\"grid-item\"><img src=\"" + window.location.protocol + "/" + data + "\"</img></div>";
    $('.grid').prepend(row);
    $grid.imagesLoaded().progress( function() {
      $grid.masonry('layout');
    });
  });

  var $grid = $('.grid').masonry({
    // options
    itemSelector: '.grid-item',
    columnWidth: 200,
    percentPosition: true,
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
    $grid.imagesLoaded().progress( function() {
      $grid.masonry('layout');
    });
  });
});