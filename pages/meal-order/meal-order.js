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
    _storageKeyName: 'userInfo',
    start: '2018-01-01',
    end: '2020-01-01',
    endLimit: '2018-01-01',
    startLimit: '2020-01-01',
    canRefund: false,
    startBegin: '2018-01-01',
    reason: '-',
    orderId:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var flag = options.from == 'meal',
      that = this;
    this.data.fromCartFlag = flag;

    var userInfo = wx.getStorageSync('userInfo')
    if (userInfo == null) {
      wx.showLoading({
        title: '加载中',
      })
      var userToken = wx.getStorageSync('token')
      token.login(userToken)
    }
    this.setData({
      userInfo: wx.getStorageSync('userInfo')
    })
    //新订单
    if (flag) {
      this.setData({
        meal: wx.getStorageSync(options.id),
        account: options.account,
        orderStatus: 0,
        payStatus: 0
      });
    }
    //旧订单
    else {
      this.setData({
        orderId: options.orderId
      })
    }
  },
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
    if (this.data.orderId == null) {
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
    order = new MealOrder();
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
        
      } else{
        wx.showToast({
          title: data.msg,
          icon: 'none',
          duration: 1500
        })
       
      }
    });
  },

  /* 再次次支付*/
  _oneMoresTimePay: function () {
    console.log("二次支付")
    //this._execPay(this.data.orderId);
    wx.hideLoading()
  },

  // 申请退款
  refund: function () {
    var that = this;
    var dateGap = ((Date.parse(this.data.end.replace(/-/g, '/')) - Date.parse((this.data.start.replace(/-/g, '/')))) / 86400000)
    var content = '申请' + this.data.start + '至' + this.data.end + '共' + (dateGap + 1) + '天退款'
    wx.showModal({
      title: '请确认',
      content: content,
      success: function (res) {
        if (res.confirm) {
          var reason = that.data.reason
          
          that._refund(reason, dateGap + 1)
        } else if (res.cancel) {
        }
      }
    })
  },



  _refund: function (reason, days) {
    var userToken = wx.getStorageSync('token');
    var refundForm = {};
    if (userToken == null) {
      token.getTokenFromServer()
      showTips("错误", "验证失败，请稍后重试", false);
      return
    } else {
      refundForm = this._makeRefundForm(userToken, reason, days)
    }
    var that = this;
    order.refund(refundForm, (data) => {
      //订单生成成功
      if (data.code == 0) {
        //更新订单状态
        wx.switchTab({
          url: '../my/my'
        })
        console.log("申请成功")
      }
      else if (data.code == -1) {
        wx.showToast({
          title: '登录校验失败',
          icon: 'none',
          duration: 1500
        })
        that.token.getTokenFromServer()
      } else if (data.code == -2){
        wx.showToast({
          title: '订单和用户不匹配',
          icon: 'none',
          duration: 1500
        })
      } else if (data.code == -3) {
        wx.showToast({
          title: '退款天数超过限制',
          icon: 'none',
          duration: 1500
        })
      } else if (data.code == -4) {
        wx.showToast({
          title: data.msg+'退款日期重复',
          icon: 'none',
          duration: 1500
        })
      } else if (data.code == -5) {
        wx.showToast({
          title: data.msg,
          icon: 'none',
          duration: 1500
        })
      }
    });

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
  // 拼装申请退款订单
  _makeRefundForm: function (token, reason, days) {
    var userInfo = this.data.userInfo
    var startDate = this.data.start
    var endDate = this.data.end
    var date = startDate + ',' + endDate
    var refundForm = {
      orderId: this.data.orderId,
      token: token,
      date: date,
      reason: reason,
      days: days
    }
    return refundForm;
  },
  //拼装订单
  _makeOrderForm: function (meal, token) {
    var userInfo = this.data.userInfo
    var orderForm = {
      buyerName: userInfo.name,
      buyerPhone: userInfo.phone,
      stdNum: userInfo.stdNum,
      buyerSchool: userInfo.school,
      buyerCls: userInfo.cls,
      mealId: this.data.meal.id,
      token: token
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
          url: '../pay-result/pay-result?orderId=' + orderId + '&flag=' + flag + '&from=meal'
        });
      }else{
        this.showTips("错误", "调用微信支付失败", false)
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

    if (this.data.orderId) {

      var that = this;
      //下单后，支付成功或者失败后，点左上角返回时能够更新订单状态 所以放在onshow中
      var orderId = this.data.orderId;
      order.getOrderInfoById(orderId, (data) => {
        //console.log(data)
        var createDate = new Date(data.data.createTime * 1000)

        that.setData({
          payStatus: data.data.payStatus,
          orderStatus: data.data.orderStatus,
          meal: data.data.mealInfo,
          account: data.data.orderAmount,
          basicInfo: {
            orderTime: createDate.toLocaleString(),
            orderNo: data.data.orderId
          }
        });
        this._setDate(data.data.mealInfo)
      });
    }

  },
  //设置初试时间
  _setDate: function (meal) {
    //设置套餐所在月份
    var that = this
    //判断是否能退款

    var mealLimitDate = new Date(meal.mealDate * 1000).toLocaleDateString()
    var mealMonth = new Date(meal.mealDate * 1000).getMonth() + 1;
    mealMonth = (mealMonth < 10 ? ("0" + mealMonth) : mealMonth);
    var mealYear = new Date(meal.mealDate * 1000).getFullYear();
    var mealStartStr = mealYear.toString() + '-' + mealMonth.toString() + '-' + '01'
    //获取当前时间与套餐月份比较
    var date = new Date()
    var dateGap = ((Date.parse(mealStartStr.replace(/-/g, '/')) - Date.parse(date.toLocaleDateString())) / 86400000)
    if (dateGap > 3 && that.data.payStatus == 1) {
      that.setData({
        start: mealStartStr,
        startBegin: mealStartStr,
        end: mealStartStr,
        endBegin: mealStartStr,
        endLimit: mealLimitDate,
        startLimit: mealLimitDate,
        canRefund:true
      })

    } else {
      var currentDate = date.toLocaleDateString();
      var startDate = new Date(currentDate)
      startDate.setDate(startDate.getDate() + 3)
      var startYear = startDate.getFullYear()
      var startMonth = startDate.getMonth() + 1
      startMonth = (startMonth < 10 ? "0" + startMonth : startMonth);
      var startDay = startDate.getDate()
      startDay = (startDay < 10 ? ("0" + startDay) : startDay);
      var startDateStr = startYear.toString() + '-' + startMonth.toString() + '-' + startDay.toString()
      var limit = ((Date.parse(mealLimitDate) - Date.parse(startDateStr.replace(/-/g, '/'))) / 86400000)
      if (limit > 0&&that.data.payStatus==1) {
        that.setData({
          startBegin: startDateStr,
          start: startDateStr,
          end: startDateStr,
          endBegin: startDateStr,
          endLimit: mealLimitDate,
          startLimit: mealLimitDate,
          canRefund: true
        })
      }
    }
  },

  startDateChange: function (e) {
    this.setData({
      start: e.detail.value,
      end: e.detail.value,
      endBegin: e.detail.value,
    })
  },
  endDateChange: function (e) {
    this.setData({
      end: e.detail.value,
    })
  },

  reasonConfirm: function (e) {
    this.setData({
      reason: e.detail.value
    })
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