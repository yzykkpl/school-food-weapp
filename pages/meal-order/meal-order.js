// pages/order/order.js
import { MealOrder } from '../meal-order/meal-order-model.js';
import { Cart } from '../cart/cart-model.js';
import { Address } from '../../utils/address.js';
import { Token } from '../../utils/token.js';
var app = getApp()
var order = new MealOrder();
var address = new Address();
var token = new Token()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    fromCartFlag: true,
    userInfo: null,
    _storageKeyName: 'userInfo'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    var flag = options.from == 'meal',
      that = this;
    this.data.fromCartFlag = flag;

    var userInfo = wx.getStorageSync('userInfo')
    if(userInfo==null){
      wx.showLoading({
        title: '加载中',
      })
      var userToken=wx.getStorageSync('token')
      token.login(userToken)
    }
    this.setData({
      userInfo:wx.getStorageSync('userInfo')
    })
    //新订单
    if (flag) {
      this.setData({
        meal: wx.getStorageSync(options.id),
        account:options.account,
        orderStatus: 0,
        payStatus:0
      });
    }
    //旧订单
    else {
      this.setData({
        orderId: options.orderId
      })
    }
  },

  /*修改或者添加地址信息*/
  // editAddress: function () {
  //   var that = this;
  //   wx.chooseAddress({
  //     success: function (res) {
  //       var addressInfo = {
  //         name: res.userName,
  //         phone: res.telNumber,
  //         address: address.setAddressInfo(res)
  //       };
  //       that._bindAddressInfo(addressInfo);

  //       //保存地址
  //       wx.setStorageSync(that.data._storageKeyName, addressInfo)
  //     },
  //     fail: function () {
  //       wx.getSetting({
  //         success: function (res) {
  //           if (!res.authSetting['scope.address']) {
  //             wx.showModal({
  //               title: '您已拒绝地址授权',
  //               content: '请点击右上角"..."->"关于"->右上角"..."->"设置"进行授权',
  //             })
  //           }
  //         }
  //       })
  //     }
  //   })
  // },

  /*绑定地址信息*/
  // _bindAddressInfo: function (addressInfo) {
  //   this.setData({
  //     addressInfo: addressInfo
  //   });
  // },

  /*下单和付款*/
  pay: function () {
    if (!this.data.userInfo) {
      this.showTips('下单提示', '个人信息获取失败');
      return;
    }
    wx.showLoading({
      title: '加载中^_^',
      mask: true
    })
    if (this.data.payStatus == 0) {
      this._firstTimePay();
    } else {
      this._oneMoresTimePay();
    }
  },

  /*第一次支付*/
  _firstTimePay: function () {
    var userToken = wx.getStorageSync('token');
    var orderForm = {};
    if (userToken == null) {
      token.getTokenFromServer()
      showTips("错误", "验证失败，请稍后重试", false);
      return
    } else {
      orderForm = this._makeOrderForm(this.data.meal, userToken)
    }
    order = new Order();
    var that = this;
    //支付分两步，第一步是生成订单号，然后根据订单号支付
    order.doOrder(orderForm, (data) => {
      //订单生成成功
      if (data.code == 0) {
        //更新订单状态
        var orderId = data.data.orderId;
        that.setData({
          orderId: orderId,
          fromCartFlag: false
        })
        //开始支付
        console.log("开始支付")
        //that._execPay(orderId)
      } 
      else if (data.code == -1){
        wx.showToast({
          title: '登录校验失败',
          icon: 'none',
          duration: 1500
        })
        that.token.getTokenFromServer()
      }
    });
  },

  /* 再次次支付*/
  _oneMoresTimePay: function () {
    console.log("二次支付")
    //this._execPay(this.data.orderId);
  },


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
  // 拼装订单
  _makeOrderForm: function (meal, token) {
    var userInfo = this.data.userInfo
    var orderForm = {
      buyerName: userInfo.name,
      buyerPhone: userInfo.phone,
      stdNum: userInfo.stdNum,
      buyerSchool: userInfo.school,
      buyerCls:userInfo.cls,
      mealId: this.data.meal.id,
      token:token
    }
    return orderForm;
  },

  /*
       *开始支付
       * params:
       * id - {int}订单id
       */
  _execPay: function (orderId) {
    
    if (!order.onPay) {
      this.showTips('打烊啦', '现在已经不配送啦', true);//屏蔽支付，提示

      return;
    }
    var that = this;
    order.execPay(orderId, (statusCode) => {
      if (statusCode != 0) {


        var flag = statusCode == 2;
        wx.navigateTo({
          url: '../pay-result/pay-result?orderId=' + orderId + '&flag=' + flag + '&from=order'
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("order show")
    if (this.data.orderId) {
      var that = this;
      //下单后，支付成功或者失败后，点左上角返回时能够更新订单状态 所以放在onshow中
      var orderId = this.data.orderId;
      order.getOrderInfoById(orderId, (data) => {
        //console.log(data)
        var date = new Date(data.data.createTime*1000)
         that.setData({
           payStatus: data.data.payStatus,
           orderStatus:data.data.orderStatus,
           meal: data.data.mealInfo,
           account: data.data.orderAmount,
           basicInfo: {
           orderTime: date.toLocaleString(),
           orderNo: data.data.orderId
           }
         });
      });
    }
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})