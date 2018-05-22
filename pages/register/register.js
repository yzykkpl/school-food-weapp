// pages/register/register.js
import { Token } from '../../utils/token.js';
import { Base } from '../../utils/base.js';
var token = new Token()
var base = new Base()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    schools: [{
      id:0,
      name:'请选择',
      cls:null
      }],
    schoolIndex: 0,
    classes: [{
      id:0,
      clsName:'请选择',
      }],
    classIndex: 0,
    teacher: false,

  },
  onLoad: function (options) {

    var that=this;
    var options = {
      url: '/school/list',
      method: 'GET',
      sCallBack: function (res) {
        console.log(res)
        that._listSchool(res.data)
      }
    }
    base.request(options)
  },
  //组合表单数据，拿token
  formSubmit: function (e) {
    var data = e.detail.value;
    if (!this.data.teacher) {
      if(!this._checkStudent(data)){
        return;
      }
      data.school = this.data.schools[data.school].name
      data.cls = this.data.classes[data.cls].clsName
      data.status='0'
    }else{
      if (!this._checkTeacher(data)) {
        return;
      }
      data.school = this.data.schools[data.school].name
      data.cls = '-'
      data.stdNum='-'
      data.status='1'
    }
    this.setData({
      userData: data
    })
    token.getTokenFromServer(this._register);
  },
  //注册
  _register: function (res) {
    var userForm=this.data.userData
    console.log(userForm)
    userForm.token = res;
    var allParams = {
      url: 'wechat/register',
      method: 'post',
      data: userForm,
      sCallBack: function (data) {
        wx.setStorageSync('userInfo', data.data.userInfo)
        wx.switchTab({
          url: '../index/index'
        })
      },
      eCallback: function (err) {
        console.log(err)
      }
    };
    base.request(allParams);
  },
  bindSchoolChange: function (e) {
    var cls = this.data.schools[e.detail.value].cls
    this.setData({
      schoolIndex: e.detail.value,
      classes:cls
    })

  },
  bindClassChange: function (e) {
    this.setData({
      classIndex: e.detail.value
    })
  },
  switchTeacher:function(){
    this.setData({
      teacher:true
    })
  },
  switchStudent: function () {
    this.setData({
      teacher: false
    })
  },
  //验证学生表单
  _checkStudent:function(data){
    if (data.name==null) {
      wx.showToast({
        title: '请填写姓名',
        duration: 1500
      })
      return false;
    }
    if (data.stdNum ==null) {
      wx.showToast({
        title: '请填写学号',
        duration: 1500
      })
      return false;
    }
    if (data.phone == null||data.phone.length<11) {
      wx.showToast({
        title: '手机号格式错误',
        duration: 1500
      })
      return false;
    }
    
    return true;
  },
  _checkTeacher:function (data) {
    if (data.name == null) {
      wx.showToast({
        title: '请填写姓名',
        duration: 1500
      })
      return false;
    }
    if (data.phone == null || data.phone.length < 11) {
      wx.showToast({
        title: '手机号格式错误',
        duration: 1500
      })
      return false;
    }
    return true;
  },

  _listSchool:function(data){
    this.setData({
      schools:data
    })
    this.setData({
      classes: data[0].cls
    })
  }
  // getUserInfo: function (res) {
  //   console.log(res)
  //   if (res.detail.rawData) {
  //     var userInfo = JSON.parse(res.detail.rawData)
  //     token.verify(this.goIndex)
  //   } else {
  //     wx.hideLoading()
  //   }
  // },

})