// pages/product/product.js
import { Token } from '../../utils/token.js';
import { Order } from '../order/order-model.js';
var token = new Token();
var order=new Order();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    product: {},
    countsArray: [1, 2, 3, 4, 5,6,7,8,9,10],
    productCounts: 1,
    tabs: ['商品详情'],
    hiddenSmallImg: true,
    start: '2018-01-01',
    startLimit: '2020-01-01',
    startBegin: '2018-01-01',
    days: 1,
    comment:'-'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("load")
    var that = this;
    wx.showLoading({
      title: '加载中^_^',
    })
    var userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      var utoken = wx.getStorageSync('token')
      token.login(utoken, ()=>{
        that.setData({
          userInfo: wx.getStorageSync('userInfo')
        })
      })
    }else{
      that.setData({
        userInfo: userInfo
      })
    }
    var id = options.id
    that.setData({
      product: wx.getStorageSync(id),
    })
    that._setDate()
  },

  // 支付
  pay: function () {
    if (!this.data.userInfo) {
      this.showTips('下单提示', '个人信息获取失败');
      return;
    }
    wx.showLoading({
      title: '加载中^_^',
      mask: true
    })
    this._pay();

  },

  /*第一次支付*/
  _pay: function () {
    var userToken = wx.getStorageSync('token');
    var orderForm = {};
    if (userToken == null) {
      token.getTokenFromServer()
      showTips("错误", "验证失败，请稍后重试", false);
      return
    } else {
      orderForm = this._makeOrderForm(this.data.product, userToken)
    }
    var that = this;
    //支付分两步，第一步是生成订单号，然后根据订单号支付
    order.doOrder(orderForm, (data) => {
      //订单生成成功
      if (data.code == 0) {
        //更新订单状态
        var orderId = data.data.orderId;
        //开始支付
        console.log("开始支付")
        wx.hideLoading()
        //that._execPay(orderId)
      }
      else if (data.code == -1) {
        wx.showToast({
          title: '登录校验失败',
          icon: 'none',
          duration: 1500
        })
        that.token.getTokenFromServer()

      }
    });
  },

  _makeOrderForm: function (product, token) {
    var startDate = this.data.start
    var userInfo = this.data.userInfo
    var counts = this.data.productCounts
    var orderForm = {
      buyerName: userInfo.name,
      buyerPhone: userInfo.phone,
      stdNum: userInfo.stdNum,
      buyerSchool: userInfo.school,
      buyerCls: userInfo.cls,
      productId: product.id,
      date: startDate,
      counts: counts,
      token: token,
      comment:this.data.comment
    }
    return orderForm;
  },
  /*
       *开始支付
       * params:
       * id - {int}订单id
       */
  _execPay: function (orderId) {
    var that = this;
    order.execPay(orderId, (statusCode) => {
      if (statusCode != 0) {
        var flag = statusCode == 2;
        wx.navigateTo({
          url: '../pay-result/pay-result?orderId=' + orderId + '&flag=' + flag + '&from=order'
        });
      }else{
        this.showTips("错误","调用微信支付失败",false)
      }
    });
  },


  /*设置时间*/
  _setDate: function () {
    //设置套餐所在月份
    var that = this
    //判断是否能退款
    //获取当前时间与套餐月份比较
    var date = new Date()
    var currentDate = date.toLocaleDateString();
    var startDate = new Date(currentDate)
    startDate.setDate(startDate.getDate() + 3)
    var startYear = startDate.getFullYear()
    var startMonth = startDate.getMonth() + 1
    startMonth = (startMonth < 10 ? "0" + startMonth : startMonth);
    var startDay = startDate.getDate()
    startDay = (startDay < 10 ? ("0" + startDay) : startDay);
    var startDateStr = startYear.toString() + '-' + startMonth.toString() + '-' + startDay.toString()
    that.setData({
      startBegin: startDateStr,
      start: startDateStr,
    })
    wx.hideLoading()
  },

  startDateChange: function (e) {
    this.setData({
      start: e.detail.value,
    })
    // this._updateDays()
  },
  countsChange: function (e) {
    var index = e.detail.value;
    console.log(e)
    var selectedCount = this.data.countsArray[index]
    this.setData({
      productCounts: selectedCount
    })
  },
  commentConfirm: function (e) {
    this.setData({
      comment: e.detail.value
    })
  },

  // _updateDays: function () {
  //   var days = ((Date.parse(this.data.end.replace(/-/g, '/')) - Date.parse((this.data.start.replace(/-/g, '/')))) / 86400000)
  //   this.setData({
  //     days: days + 1
  //   })
  // },
  // submitOrder: function () {
  //   var account = this.data.product.price
  //   var id = this.data.id
  //   wx.navigateTo({
  //     url: '../order/order?account=' + account + '&id=' + id
  //   });
  // },
  /*
* 提示窗口
* params:
* title - {string}标题
* content - {string}内容
* flag - {bool}是否跳转到 "我的页面"
*/
  showTips: function (title, content, flag) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: false,
      success: function (res) {
        if (flag) {
          wx.switchTab({
            url: '/pages/my/my'
          });
        }
      }
    });
  },
})