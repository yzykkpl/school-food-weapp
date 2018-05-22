// pages/order/order.js
import { Order } from '../order/order-model.js';
import { Cart } from '../cart/cart-model.js';
import { Address } from '../../utils/address.js';
import { Token } from '../../utils/token.js';
var app = getApp()
var order = new Order();
var cart = new Cart();
var address = new Address();
var token = new Token()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    fromCartFlag: true,
    addressInfo: null,
    _storageKeyName: 'address'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var flag = options.from == 'cart',
      that = this;
    this.data.fromCartFlag = flag;
    this.data.account = options.account;

    //来自于购物车
    if (flag) {
      this.setData({
        productsArr: cart.getCartDataFromLocal(true),
        account: options.account,
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
  editAddress: function () {
    var that = this;
    wx.chooseAddress({
      success: function (res) {
        var addressInfo = {
          name: res.userName,
          phone: res.telNumber,
          address: address.setAddressInfo(res)
        };
        that._bindAddressInfo(addressInfo);

        //保存地址
        wx.setStorageSync(that.data._storageKeyName, addressInfo)
      },
      fail: function () {
        wx.getSetting({
          success: function (res) {
            if (!res.authSetting['scope.address']) {
              wx.showModal({
                title: '您已拒绝地址授权',
                content: '请点击右上角"..."->"关于"->右上角"..."->"设置"进行授权',
              })
            }
          }
        })
      }
    })
  },

  /*绑定地址信息*/
  _bindAddressInfo: function (addressInfo) {
    this.setData({
      addressInfo: addressInfo
    });
  },

  /*下单和付款*/
  pay: function () {
    if(!app.data.onPay){
      this.showTips('太晚啦', '本店已经打烊');
      return;
    }
    if (!this.data.addressInfo) {
      this.showTips('下单提示', '请填写您的收货地址');
      return;
    }
    if(app.data.allow == false){
      this.showTips('太远啦', '您的位置超出配送范围')
      return;
    }
    wx.showLoading({
      title: '加载中^_^',
      mask: true
    })
    if (this.data.orderStatus == 0) {

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
      token.verify();
      showTips("错误", "验证失败，请稍后重试", false);
      return
    } else {
      orderForm = this._makeOrderForm(this.data.productsArr, userToken)
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
        that._execPay(orderId)
      } else {
        wx.showModal({
          title: '错误',
          content: '下单失败,请返回购物车下拉刷新库存信息',
          showCancel: false,
          success: function (res) {
            if (res.confirm) {
              wx.switchTab({
                url: '/pages/cart/cart'
              });
            }

          }
        });  // 下单失败
      }
    });
  },

  /* 再次次支付*/
  _oneMoresTimePay: function () {
    this._execPay(this.data.orderId);
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
  _makeOrderForm: function (productsArr, token) {
    var userInfo = this.data.addressInfo
    var items = []

    for (let i = 0; i < productsArr.length; i++) {
      var item = {
        productId: productsArr[i].id,
        productQuantity: productsArr[i].counts
      }
      items.push(item);
    }
    var orderForm = {
      name: userInfo.name,
      phone: userInfo.phone,
      address: userInfo.address,
      token: token,
      items: JSON.stringify(items)

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
      this.deleteProducts(); //将已经下单的商品从购物车删除
      return;
    }
    var that = this;
    order.execPay(orderId, (statusCode) => {
      if (statusCode != 0) {
        that.deleteProducts();
        var flag = statusCode == 2;
        wx.navigateTo({
          url: '../pay-result/pay-result?orderId=' + orderId + '&flag=' + flag + '&from=order'
        });
      }
    });
  },

  //将已经下单的商品从购物车删除
  deleteProducts: function () {
    var ids = [], arr = this.data.productsArr;
    for (let i = 0; i < arr.length; i++) {
      ids.push(arr[i].id);
    }
    cart.delete(ids);
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
        var date = new Date(data.data.createTime*1000)
         that.setData({
           payStatus: data.data.payStatus,
           orderStatus:data.data.orderStatus,
           productsArr: data.data.orderDetailList,
           account: data.data.orderAmount,
           basicInfo: {
           orderTime: date.toLocaleString(),
           orderNo: data.data.orderId
           }, 
           addressInfo: {
             name: data.data.buyerName,
             phone: data.data.buyerPhone,
             address: data.data.buyerAddress
           }

         });
      });
    }else{
      //this._bindAddressInfo(wx.getStorageSync("address"))
      console.log(wx.getStorageSync(this.data._storageKeyName))
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