const config = require('../config');
class Base {
  constructor() {
    this.baseUrl = config.baseUrl;
    this.onPay = config.onPay;
  }
  request(options) {
    var url = this.baseUrl + options.url;
    if (!options.method) {
      options.method = 'GET'
    }
    wx.request({
      url: url,
      data: options.data,
      method: options.method,
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      success: function (res) {
        if (res.statusCode == 500) {
          wx.showModal({
            title: '错误',
            content: res.data.message,
            showCancel: false,
          })
          wx.hideLoading()
        }
        else {
          options.sCallBack && options.sCallBack(res.data);
        }
      },
      fail: function (err) {
        console.log(err)

      }
    })
  }

  getDataSet(event, key) {
    return event.currentTarget.dataset[key]
  }
}

export { Base }