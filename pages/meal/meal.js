// pages/product/product.js
import {Cart} from '../cart/cart-model.js'
var cart=new Cart()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    maxCounts:0,
    product: {},
    tabs:['商品详情'],
    hiddenSmallImg: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    
    this.setData({
      product: wx.getStorageSync(id),
      id:id
    })
  },
  submitOrder: function () {
    var id = this.data.id
    wx.navigateTo({
      url: '../order/order?account=1&from=meal&id='+id
    });
  },


})