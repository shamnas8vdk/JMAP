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
  input_pass.text('');
});

// On submission of login credentials
btn.on('click', function () {
  var pass = $('#password').val();
  var user = $('#username').val();
  var cfg = {};
  if(authenticateCredentials(user, pass)){
    storeCredentials(user, pass);
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

if(getParameterByName("access",window.location.href) == "invalid"){
  alert("Credentials Invalid");
}

function authenticateCredentials(username, password){
  //Authenticate username and password here
  var rights = ["Identify_Right","Classification_Right"];
  
  sessionStorage.setItem(
    'Rights',
    rights
  );
  return true;
}

function storeCredentials(username, password){
  $.getJSON( getJSONPath(), function( data ){
    var passphrase = data.credentialPass;
    var encryptedUsername = CryptoJS.AES.encrypt(username,passphrase);
    var encryptedPassword = CryptoJS.AES.encrypt(password,passphrase);
    sessionStorage.setItem('Username',encryptedUsername.toString());
    sessionStorage.setItem('Password',encryptedPassword.toString());
    // To Decrypt 
    // E.g. CryptoJS.AES.decrypt(encryptedUsername.toString(), passphrase).toString(CryptoJS.enc.Utf8);
    // E.g. CryptoJS.AES.decrypt(encryptedPassword.toString(), passphrase).toString(CryptoJS.enc.Utf8);
  });
}

// Get JSON file of config dynamically
function getJSONPath(){
  var array = window.location.href.split("/");
  var JSONpath;
  if(array[array.length - 1] == "" || array[array.length - 1] == null){
    JSONpath = window.location.href + "js/config.json";
  }
  else{
    JSONpath = window.location.href.replace(array[array.length - 1],"js/config.json");
  }
  return JSONpath;
}

//check if access is valid
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}