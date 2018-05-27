// pages/product/product.js
import { Cart } from '../cart/cart-model.js'
var cart = new Cart()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    maxCounts: 0,
    product: {},
    countsArray: [1, 2, 3, 4, 5],
    productCounts: 1,
    tabs: ['商品详情'],
    cartTotalCounts: 0,
    hiddenSmallImg: true,
    start: '2018-01-01',
    end: '2020-01-01',
    endLimit: '2018-01-01',
    startLimit: '2020-01-01',
    startBegin: '2018-01-01',
    days:1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中^_^',
    })
    var that = this;
    var id = options.id
    that.setData({
      product: wx.getStorageSync(id),
      cartTotalCounts: cart.getCartTotalCounts(),
    })
    that._setDate()

  },
  _updateCounts: function () {
    // var that=this
    // var cartData = cart.getCartDataFromLocal();//拿到购物车中的数据
    // that.setData({
    //   maxCounts: that.data.product.stock
    // })
    // for (var i = 0; i < cartData.length; i++) {
    //   if (cartData[i].id == that.data.product.id) {
    //     that.setData({
    //       maxCounts: that.data.product.stock - cartData[i].counts
    //     })

    //     break;
    //   }
    // }

    // var countsArray = new Array()
    // for (var i = 1; i <= Math.min(10, that.data.maxCounts); i++) {
    //   countsArray.push(i)
    // }
    // that.setData({
    //   countsArray: countsArray
    // })
    
  },
  //picker监听
  bindPickerChange: function (event) {
    var index = event.detail.value;
    var selectedCount = this.data.countsArray[index]
    this.setData({
      productCounts: selectedCount
    })
  },
  //购物车监听
  onAddToCart: function (event) {

    this.addToCart();
    //var counts = this.data.cartTotalCounts + this.data.productCounts;
    // this.setData({
    //   cartTotalCounts: cart.getCartTotalCounts()
    // })
    if (this.data.isFly) {
      return;
    }
    this._flyToCartEffect(event);

  },

  addToCart: function () {
    var that = this;
    var tempObj = {};
    var keys = ['id', 'name', 'icon', 'price', 'stock', 'image']
    keys.forEach(function (key) {
      tempObj[key] = that.data.product[key]
    })
    cart.add(tempObj, that.data.productCounts)
    that.setData({
      maxCounts: that.data.maxCounts - that.data.productCounts
    })

  },
  /*加入购物车动效*/
  _flyToCartEffect: function (events) {
    //获得当前点击的位置，距离可视区域左上角
    var touches = events.touches[0];
    var diff = {
      x: '25px',
      y: -10 - touches.clientY + 'px'
    },
      style = 'display: block;-webkit-transform:translate(' + diff.x + ',' + diff.y + ') rotate(350deg) scale(0)';  //移动距离
    this.setData({
      isFly: true,
      translateStyle: style
    });
    var that = this;
    setTimeout(() => {
      that.setData({
        isFly: false,
        translateStyle: '-webkit-transform: none;',  //恢复到最初状态
        isShake: true,
      });
      setTimeout(() => {
        that.setData({
          isShake: false,
          cartTotalCounts: cart.getCartTotalCounts()
        });
      }, 200);
    }, 1000);
  },

  /*跳转到购物车*/
  onCartTap: function () {
    wx.switchTab({
      url: '/pages/cart/cart'
    });
  },
  previewImage: function () {
    wx.previewImage({
      current: this.data.product.image,
      urls: [this.data.product.image]

    })
  },

  _setDate: function (meal) {
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
      end: startDateStr,
      endBegin: startDateStr,
      // endLimit: mealLimitDate,
      // startLimit: mealLimitDate
    })
    wx.hideLoading()

  },

  startDateChange: function (e) {
    this.setData({
      start: e.detail.value,
      end: e.detail.value,
      endBegin: e.detail.value,
    })
    this._updateDays()
  },
  endDateChange: function (e) {
    this.setData({
      end: e.detail.value,
    })
    this._updateDays()
  },

  _updateDays:function(){
  var days = ((Date.parse(this.data.end.replace(/-/g, '/')) - Date.parse((this.data.start.replace(/-/g, '/')))) / 86400000)
  this.setData({
    days:days+1
  })
  }
})