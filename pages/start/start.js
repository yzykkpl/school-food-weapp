//start.js'
import { Token } from '../../utils/token.js';
var app = getApp()
var token = new Token()
Page({
  data: {
    authBtn:false
  },
  onLoad: function () {
    this.setData({
      verifyUrl: token.getVerifyUrl()
    })
    var utoken = wx.getStorageSync('token');
    if(!utoken){
      token.getTokenFromServer(this.login)
    }else{
    this.login(utoken)
    }
  },
  getToken:function(){
    token.getTokenFromServer(this.login)
  },
  login:function(token) {
    console.log('login--'+token)
    var that = this;
    wx.request({
      url: that.data.verifyUrl + token,
      method: 'GET',
      success: function (res) {
        var code = res.data.code;
        if (code == -1) {
          that.getTokenFromServer(that.login);
        } else if(code==-2){
          wx.navigateTo({
            url: '../register/register',
          })
        }
        else {
          wx.setStorageSync('userInfo', res.data.data.userInfo)
          wx.switchTab({
            url: '../index/index'
          })
        }
      }
    })
  }
  

});