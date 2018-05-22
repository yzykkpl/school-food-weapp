
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
    if (this.data.from == 'my') {
      wx.redirectTo({
        url: '../order/order?from=order&orderId=' + this.data.orderId
      });
    } else {
      //返回上一级
      wx.navigateBack({
        delta: 1
      })
    }
  }
}
)