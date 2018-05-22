import { Base } from 'base.js';
class Products extends Base {
  constructor() {
    super();
  }
    getProducts(callBack){
    var token=wx.getStorageSync('token')
    var cart = wx.getStorageSync('cart')
    var userLocation = wx.getStorageSync('userLocation')
    var address= wx.getStorageSync('address')
    var userInfo = wx.getStorageSync('userInfo')
    wx.clearStorageSync();
    wx.setStorageSync('cart', cart)
    wx.setStorage({
      key: 'token',
      data: token,
    })
    wx.setStorage({
      key: 'userLocation',
      data: userLocation,
    })
    wx.setStorage({
      key: 'userInfo',
      data: userInfo,
    })
    wx.setStorage({
      key: 'address',
      data: address,
    })
    var that=this
    var options = {
      url: 'buyer/product/list',
      method: 'GET',
      sCallBack:function (res) {
        var all = res.data[0].foods
        that.saveAllProduct(all)
        callBack && callBack()
        res.data.shift()
        that.saveProductByCategory(res.data)
        ;//购物车回调
      }
    }
    this.request(options)
  }

   saveProductByCategory(all) {
    wx.setStorageSync('product', all)
  }

    saveAllProduct(all,callBack) {
    for(let i=0;i<all.length;i++)
      wx.setStorageSync(all[i].id, all[i]) 
  }
  
}

export { Products }