// pages/product/product.js
import {Cart} from '../cart/cart-model.js'
var cart=new Cart()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    maxCounts:0,
    product: {},
    countsArray: [],
    productCounts: 1,
    tabs:['商品详情'],
    cartTotalCounts: 0,
    hiddenSmallImg: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中^_^',
    })
    var that=this;
    var id =options.id
    that.setData({
      product: wx.getStorageSync(id),
      cartTotalCounts: cart.getCartTotalCounts(),
    })
    that._updateCounts()

  },
  _updateCounts:function(){
    var that=this
    var cartData = cart.getCartDataFromLocal();//拿到购物车中的数据
    that.setData({
      maxCounts: that.data.product.stock
    })
    for (var i = 0; i < cartData.length; i++) {
      if (cartData[i].id == that.data.product.id) {
        that.setData({
          maxCounts: that.data.product.stock - cartData[i].counts
        })
      
        break;
      }
    }

    var countsArray = new Array()
    for (var i = 1; i <= Math.min(10, that.data.maxCounts); i++) {
      countsArray.push(i)
    }
    that.setData({
      countsArray: countsArray
    })
    wx.hideLoading()
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
  onAddToCart:function(event){
    
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

  addToCart:function(){
    var that=this;
    var tempObj={};
    var keys=['id','name','icon','price','stock','image']
    keys.forEach(function(key){
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

})