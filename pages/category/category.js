// pages/category/category.js
import { Base } from '../../utils/base.js';
var base=new Base()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loadingHidden: false,
    transClassArr: ['tanslate0', 'tanslate1', 'tanslate2', 'tanslate3', 'tanslate4', 'tanslate5', 'tanslate6', 'tanslate7', 'tanslate8', 'tanslate9', 'tanslate10'],
    product:[],
    currentMenuIndex:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this._loadData()
  },

  _loadData:function(){
    this.setData({
      product: wx.getStorageSync('product'),
      loadingHidden: true,
    })


  },
  /*切换分类*/
  changeCategory: function (event) {
    var index = base.getDataSet(event,'index'),
      id = base.getDataSet(event, 'id')//获取data-set
    this.setData({
      currentMenuIndex: index
    });
  },


  onProductsItemTap: function (event) {
    var id = base.getDataSet(event, 'id')
    wx.navigateTo({
      url: '../product/product?id=' + id
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  }

})