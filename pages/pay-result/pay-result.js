
Page({
  data: {

  },
  onLoad: function (options) {
    this.setData({
      payResult: options.flag,
      orderId: options.orderId,
      from: options.from
    });
  },
  viewOrder: function () {

    wx.switchTab({
      url: '../my/my'
    })
  }
})