requirejs.config({
    baseUrl: 'js',
});

require(['nico', 'jquery', 'spectrum'], function (foo) {
    
  var w = window.outerWidth;
  var h = window.innerHeight;

  let nico = new nicoJS({
      app       : document.getElementById('app'),
      width     : w,
      height    : h,
      font_size : 60,     // opt
      color     : '#fff'  // opt
  })

  console.log(nico)

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

      var jqxhr = $.get( "comment", { comment: text, color: $("#custom").spectrum("get").toHexString()}, function(aData) {

      })
      .done(function(data) {

      })
      .fail(function() {
        
      })
      .always(function() {
        nico.send(text, $("#custom").spectrum("get").toHexString());
        comment.val("");
      });

    }
  })

  $("#custom").spectrum({
    color: "#fff"
  });

});



