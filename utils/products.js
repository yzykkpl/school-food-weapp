import { Base } from 'base.js';
class Products extends Base {
  constructor() {
    super();
  }
    getProducts(callBack){
    var token=wx.getStorageSync('token')
    var userInfo = wx.getStorageSync('userInfo')
    var schoolId=userInfo.schoolId
    wx.clearStorageSync();
    wx.setStorage({
      key: 'token',
      data: token,
    })
    wx.setStorage({
      key: 'userInfo',
      data: userInfo,
    })
    var that=this
    var options = {
      url: 'buyer/product/list',
      data:{
        schoolId:schoolId
      },
      method: 'GET',
      sCallBack:function (res) {
        var all = res.data[0].foods
        that.saveAllProduct(all)
        res.data.shift()
        that.saveProductByCategory(res.data, callBack)
        ;//购物车回调
      }
    }
    this.request(options)
  }

   saveProductByCategory(all,callBack) {
    wx.setStorageSync('product', all)
    console.log("1")
    callBack && callBack()
  }

    saveAllProduct(all,callBack) {
    for(let i=0;i<all.length;i++)
      wx.setStorageSync(all[i].id, all[i]) 
  }
  
}

export { Products }