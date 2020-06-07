var config = {"api": "%gatewayAPI%", "version": "1.0"};
var PetkaPay = new function () {

  try {
    var blockScreenStyle = document.createElement("style");
    blockScreenStyle.innerHTML =
            " html.blockScreen { width: 100%; height: 100%; overflow: hidden; }" +
            " html.blockScreen body { width: 100%; height: 100%; overflow: visible; position: fixed; margin-top: 0; margin-left: 0; }";

    document.getElementsByTagName('head')[0].appendChild(blockScreenStyle);
  } catch (e) {
  }

  var paymentFrameWrapper;

  this.pay = function (options)
  {
    setBlockPage(true);

    options.params['version'] = config.version;

    paymentFrameWrapper = jQuery("<div/>")
            .attr("id", "paymentFrameWrapper")
            .css({
              "z-index": 9999, "position": "fixed",
              "right": 0, "bottom": 0, "left": 0, "top": 0,
              "overflow": "hidden", "-webkit-transform": "translate3d(0, 0, 0)"
            });

    jQuery("body").append(paymentFrameWrapper);

    var paymentFrame = jQuery("<iframe/>")
            .css({
              "border": 0, "margin": 0, "padding": 0,
              "width": "100%", "height": "100%",
              "-webkit-transform": "translate3d(0, 0, 0)"
            })
            .attr({
              "id": "petkaPayFrame", "name": "petkaPayFrame",
              "frameborder": 0, "allowtransparency": "true",
              "src": config.api + "/html/paymentFrame.html"
            });

    paymentFrameWrapper.append(paymentFrame);

    jQuery.ajax({
      type: "POST",
      url: config.api + "/payment/start",
      data: JSON.stringify(options.params),
      contentType: "application/json; charset=utf-8",
      dataType: 'json',
      success: function (data) {
        console.log(data);

        paymentFrame.attr({"src": config.api + "/html/paymentFrame.html?paymentNumber=" + data.paymentNumber
        });

      }
    });

    if (window.addEventListener) {
      window.addEventListener('message', windowEventHandler);
    } else if (window.attachEvent) {
      window.attachEvent('message', windowEventHandler);
    }

    function windowEventHandler(event) {
//      if (event.origin !== config.api) {
//        console.log("Ignoring event from: " + event.origin);
//        return;
//      }

      if (event.data == "close") {
        close();
      } else if (event.data == "paid") {
        if (options.onSuccess instanceof Function) {
          options.onSuccess();
        }
        close();
      } else if (event.data == "cancel") {
        if (options.onCancel instanceof Function) {
          options.onCancel();
        }
        close();
      }
    }

    function close() {
      setBlockPage(false);
      paymentFrame.remove();
      paymentFrameWrapper.remove();
      if (window.removeEventListener) {
        window.removeEventListener('message', windowEventHandler);
      } else if (window.detachEvent) {
        window.detachEvent('message', windowEventHandler);
      }
    }

  };



  function setBlockPage(block) {
    var html = jQuery('html');
    var body = jQuery('body');
    var scrollPos;

    if (block) {
      if (!html.hasClass("blockScreen")) {
        scrollPos = body.scrollTop();
        html.addClass('blockScreen');
        body.css('top', (scrollPos * -1));
      }
    } else {
      scrollPos = (parseInt(body.css('top'), 10) * -1);
      html.removeClass('blockScreen');
      body.scrollTop(scrollPos).css('top', '');
    }
  }

};


