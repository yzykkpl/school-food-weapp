// pages/cart/cart.js
import {Base} from '../../utils/base.js';
import { Cart } from 'cart-model.js';
import { Products } from '../../utils/products.js'
var products=new Products()
var base=new Base()
var cart = new Cart(); //实例化 购物车
var x1 = 0;
var x2 = 0;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    selectedCounts: 0, //总的商品数
    selectedTypeCounts: 0, //总的商品类型数
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad:function (options) {
    this.checkStock()
    wx.showLoading({
      title: '加载中^_^',
    })
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function (options) {
    var cartData = cart.getCartDataFromLocal(),
        countsInfo = cart.getCartTotalCounts(true);
    this.setData({
      selectedCounts: countsInfo.counts1,
      selectedTypeCounts: countsInfo.counts2,
      account: this._calcTotalAccountAndCounts(cartData).account,
      cartData: cartData
    });
    wx.hideLoading()
  },

  onHide: function () {
    cart.execSetStorageSync(this.data.cartData);
  },
    /*
    * 计算总金额和选择的商品总数
    * */
  _calcTotalAccountAndCounts: function (data) {
    var len = data.length,
      account = 0,//选中商品的总价格
      selectedCounts = 0,//选中商品的总个数
      selectedTypeCounts = 0;//选中商品的种类总数
    let multiple = 100;
    for (let i = 0; i < len; i++) {
      //避免 0.05 + 0.01 = 0.060 000 000 000 000 005 的问题，乘以 100 *100
      if (data[i].selectStatus) {
        account += data[i].counts * multiple * Number(data[i].price) * multiple;
        selectedCounts += data[i].counts;
        selectedTypeCounts++;
      }
    }
    return {
      selectedCounts: selectedCounts,
      selectedTypeCounts: selectedTypeCounts,
      account: account / (multiple * multiple)
    }
  },
  /*更新购物车商品数据*/
  _resetCartData: function () {
    var newData = this._calcTotalAccountAndCounts(this.data.cartData); /*重新计算总金额和商品总数*/
    this.setData({
      account: newData.account,
      selectedCounts: newData.selectedCounts,
      selectedTypeCounts: newData.selectedTypeCounts,
      cartData: this.data.cartData
    });
  },
  /*调整商品数目*/
  changeCounts: function (event) {
    var id = cart.getDataSet(event, 'id'),
      type = cart.getDataSet(event, 'type'),
      index = this._getProductIndexById(id),
      counts = 1;
    if (type == 'add') {
      cart.addCounts(id);
    } else {
      counts = -1;
      cart.cutCounts(id);
    }
    //更新商品页面
    this.data.cartData[index].counts += counts;
    this._resetCartData();
  },

  /*根据商品id得到 商品所在下标*/
  _getProductIndexById: function (id) {
    var data = this.data.cartData,
      len = data.length;
    for (let i = 0; i < len; i++) {
      if (data[i].id == id) {
        return i;
      }
    }
  },

  /*删除商品*/
  delete: function (event) {
    var id = cart.getDataSet(event, 'id'),
      index = this._getProductIndexById(id);
    this.data.cartData.splice(index, 1);//删除某一项商品

    this._resetCartData();
    //this.toggleSelectAll();

    cart.delete(id);  //内存中删除该商品
  },

  /*选择商品*/
  toggleSelect: function (event) {
    var id = cart.getDataSet(event, 'id'),
      status = cart.getDataSet(event, 'status'),
      index = this._getProductIndexById(id);
    this.data.cartData[index].selectStatus = !status;
    this._resetCartData();
  },

  /*全选*/
  toggleSelectAll: function (event) {
    var status = cart.getDataSet(event, 'status') == 'true';
    var data = this.data.cartData,
      len = data.length;
    for (let i = 0; i < len; i++) {
      data[i].selectStatus = !status;
    }
    this._resetCartData();
  },

  /*提交订单*/
  submitOrder: function () {
    wx.navigateTo({
      url: '../order/order?account=' + this.data.account + '&from=cart'
    });
  },

  /*查看商品详情*/
  onProductsItemTap: function (event) {
    var id = base.getDataSet(event, 'id')
    wx.navigateTo({
      url: '../product/product?id=' + id
    })
  },
  //强制刷新购物车商品库存
  checkStock:function() {
    products.getProducts(this._checkStock);//从服务器刷新商品数据
  },

 _checkStock:function () {
    var cartData = wx.getStorageSync('cart')
    for (let i = 0; i < cartData.length; i++) {
      var product = wx.getStorageSync(cartData[i].id)
      if (product) {
        cartData[i].stock = product.stock
        cartData[i].stockStatus = 0
        cartData[i].lack = cartData[i].counts - product.stock
        cartData[i].selectStatus = true
        cartData[i].counts = Math.min(cartData[i].counts, product.stock)
      } else {
        cartData[i].stockStatus = 1
        cartData[i].selectStatus = false
        cartData[i].stock = 0
        cartData[i].counts = 0
      }
    }
    cart.execSetStorageSync(cartData)
    var cartData = cart.getCartDataFromLocal(),
        countsInfo = cart.getCartTotalCounts(true);
    this.setData({
      selectedCounts: countsInfo.counts1,
      selectedTypeCounts: countsInfo.counts2,
      account: this._calcTotalAccountAndCounts(cartData).account,
      cartData: cartData
    });
    wx.hideLoading()
  },
 onPullDownRefresh:function(){
   this.checkStock()
 }



})