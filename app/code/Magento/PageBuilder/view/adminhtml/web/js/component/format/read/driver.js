/*eslint-disable */
define(["../../../component/config"], function (_config) {
  /**
   * Copyright © Magento, Inc. All rights reserved.
   * See COPYING.txt for license details.
   */
  var Driver =
  /*#__PURE__*/
  function () {
    function Driver() {}

    var _proto = Driver.prototype;

    /**
     * Read heading type and title from the element
     *
     * @param element HTMLElement
     * @returns {Promise<any>}
     */
    _proto.read = function read(element) {
      var target = element.querySelector("a").getAttribute("target");
      var response = {
        alt: element.querySelector("img:nth-child(1)").getAttribute("alt"),
        image: this.generateImageObject(element.querySelector("img:nth-child(1)").getAttribute("src")),
        link_text: element.querySelector("a>div") === null ? "" : element.querySelector("a>div").innerHTML,
        link_url: element.querySelector("a").getAttribute("href"),
        mobile_image: "",
        open_in_new_window: target && target === "_blank" ? "1" : "0",
        title_tag: element.querySelector("a").getAttribute("title")
      }; // Detect if there is a mobile image and update the response

      if (element.querySelector("img:nth-child(2)") && element.querySelector("img:nth-child(2)").getAttribute("src")) {
        var mobileImage = "mobile_image";
        response[mobileImage] = this.generateImageObject(element.querySelector("img:nth-child(2)").getAttribute("src"));
      }

      return Promise.resolve(response);
    };
    /**
     * Magentorate the image object
     *
     * @param {string} src
     * @returns {ImageObject}
     */


    _proto.generateImageObject = function generateImageObject(src) {
      // Match the URL & type from the directive
      if (/{{.*\s*url="?(.*\.([a-z|A-Z]*))"?\s*}}/.test(decodeURIComponent(src))) {
        var _$exec = /{{.*\s*url="?(.*\.([a-z|A-Z]*))"?\s*}}/.exec(decodeURIComponent(src)),
            _url = _$exec[1],
            _type = _$exec[2];

        return [{
          name: _url.split("/").pop(),
          size: 0,
          type: "image/" + _type,
          url: _config.getInitConfig("media_url") + _url
        }];
      }

      return "";
    };

    return Driver;
  }();

  return Driver;
});
//# sourceMappingURL=driver.js.map
