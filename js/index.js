var form = $('.form');
var btn = $('#submit');
var topbar = $('.topbar');
var input_pass = $('#password');
var input_user = $('#username');
var article = $('.article');
var tries = 0;
var h = input_pass.height();

$('.spanColor').height(h + 23);
input_pass.on('focus', function () {
  topbar.removeClass('error success');
  input.text('');
});

// On submission of login credentials
btn.on('click', function () {
  var pass = $('#password').val();
  var user = $('#username').val();
  if(authenticateCredentials(user, pass)){
    location.assign("home.html");
  }
  else{
    //handle none authorized authentication
  }
});

$('.form').keypress(function (e) {
  if (e.keyCode == 13)
    submit.click();
});
input_pass.keypress(function () {
  topbar.removeClass('success error');
});

function authenticateCredentials(username, password){
  return true;
}