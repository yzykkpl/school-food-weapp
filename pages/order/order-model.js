/**
 * Created by jimmy on 17/03/09.
 */

import { Base } from '../../utils/base.js';
import { Token } from '../../utils/token.js'

class Order extends Base {


  constructor() {
    super();
    this._storageKeyName = 'newOrder';
    this.token = new Token()
  }

  /*下订单*/
  doOrder(orderForm, callback) {

    var that = this;
    var allParams = {
      url: 'buyer/order/create',
      method: 'post',
      data: orderForm,
      sCallBack: function (data) {
        that.execSetStorageSync(true);
        callback && callback(data);
      },
      eCallback: function (err) {
        console.log(err)
      }
    };
    this.request(allParams);
  }

  /*
  * 拉起微信支付
  * params:
  * norderNumber - {int} 订单id
  * return：
  * callback - {obj} 回调方法 ，返回参数 可能值 0:商品缺货等原因导致订单不能支付;  1: 支付失败或者支付取消； 2:支付成功；
  * */
  execPay(orderId, callback) {
    var allParams = {
      url: 'pay/create',
      type: 'GET',
      data: { orderId: orderId },
      sCallBack: function (data) {
        var result = data.data
        var timeStamp = result.timeStamp;
        if (timeStamp) { //可以支付
          wx.hideLoading();
          wx.requestPayment({
            'timeStamp': timeStamp.toString(),
            'nonceStr': result.nonceStr,
            'package': result.package,
            'signType': result.signType,
            'paySign': result.paySign,
            success: function () {
              callback && callback(2);
            },
            fail: function () {
              callback && callback(1);
            }
          });
        } else {
          wx.hideLoading();
          callback && callback(0);
        }
      }
    };
    this.request(allParams);
  }

  /*获得所有订单,pageIndex 从1开始*/
  getOrders(pageIndex, token, start, end, callback) {
    var allParams = {
      url: 'buyer/order/dateList',
      data: {
        token: token,
        page: pageIndex,
        start: start,
        end: end
      },
      type: 'get',
      sCallBack: function (data) {
        callback && callback(data);  //1 未支付  2，已支付  3，已发货，4已支付，但库存不足
      }
    };
    this.request(allParams);
  }

  /*获得订单的具体内容*/
  getOrderInfoById(orderId, callback) {
    var token = wx.getStorageSync('token')
    if (!token) {
      showTips('错误', '登录信息过期,请重试')
      this.token.getTokenFromServer()
      return;
    } else {
      this.token._veirfyFromServer(token)
    }
    var that = this;
    var allParams = {
      url: '/buyer/order/detail',
      method: 'GET',
      data: {
        token: token,
        orderId: orderId
      },
      sCallBack: function (data) {
        callback && callback(data);
      },
      eCallback: function () {

      }
    };
    that.request(allParams);
  }

  /*本地缓存 保存／更新*/
  execSetStorageSync(data) {
    wx.setStorageSync(this._storageKeyName, data);
  };

  /*是否有新的订单*/
  hasNewOrder() {
    var flag = wx.getStorageSync(this._storageKeyName);
    return flag == true;
  };
  cancel(orderId, callBack) {
    var token = wx.getStorageSync('token')
    if (!token) {
      showTips('错误', '登录信息过期,请重试')
      this.token.getTokenFromServer()
      return;
    } else {
      this.token._veirfyFromServer(token)
    }
    var that = this;
    var allParams = {
      url: '/buyer/order/cancel',
      method: 'POST',
      data: {
        token: token,
        orderId: orderId
      },
      sCallBack: function (data) {
        callBack && callBack(data);
      },
      eCallback: function () {

      }
    };
    that.request(allParams);
  }
}

export { Order };