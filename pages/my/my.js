import { Address } from '../../utils/address.js';
import { Order } from '../order/order-model.js';
import { MealOrder } from '../meal-order/meal-order-model.js';
import { My } from '../my/my-model.js';
import { Token } from '../../utils/token.js';

var address = new Address();
var order = new Order();
var mealOrder=new MealOrder();
var my = new My();
var token = new Token();
var app = getApp()
var sliderWidth = 115;

Page({
  data: {
    tabs: ['套餐订单', '水果订单'],
    pageIndex: 1,
    mealPageIndex:1,
    isLoadedAllFruit: false,
    isLoadedAllMeal:false,
    loadingHidden: false,
    orderArr: [],
    mealOrderArr:[],
    addressInfo: null,
    activeIndex: 0,
    sliderOffset: 0,
    sliderLeft: 0,
    start:'2018-01-01',
    end:'2020-01-01'
  },
  onLoad: function () {
    var date=new Date()
    var currentYear=date.getFullYear();
    var currentMounth=date.getMonth();
    var nextMounth = currentMounth+1;
    nextMounth = (nextMounth < 10 ? "0" + (nextMounth + 1) : nextMounth + 1);
    currentMounth = (currentMounth < 10 ? "0" + (currentMounth+1) : currentMounth+1); 
    var startDate = currentYear.toString() + '-' + currentMounth.toString()+'-'+'01'
    var endDate = currentYear.toString() + '-' + nextMounth.toString() + '-' + '01'
    if (currentMounth==12){
      endDate = (currentYear+1).toString()+'-'+'01-01'
    }
    this.setData({
      start: startDate,
      end: endDate
    })
    var that = this
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
        });
      }
    });
    
    this._loadData();
  },
  onShow: function () {
    var userInfo = wx.getStorageSync("userInfo")
    this.setData({
      userInfo: userInfo
    });
    //更新订单,相当自动下拉刷新,只有非第一次打开 “我的”页面，且有新的订单时 才调用。
    var newOrderFlag = order.hasNewOrder();
    if (this.data.loadingHidden && newOrderFlag) {
      this.onPullDownRefresh();
    }
  },

  _loadData: function () {
    var that = this;
    this._getOrders();
    this._getMealOrders();
    order.execSetStorageSync(false);  //更新标志位
  },

  /*水果订单信息*/
  _getOrders: function (callback) {
    var that = this;
    var token = wx.getStorageSync('token')
    if (!token) {
      this.showTips('错误', '登录信息过期,请重试')

      return;
    }
    order.getOrders(this.data.pageIndex - 1, token, (res) => {
      var data = res.data;
      that.setData({
        loadingHidden: true
      });
      if (data.length > 0) {
        that.data.orderArr.push.apply(that.data.orderArr, data);  //数组合并
        that.setData({
          orderArr: that.data.orderArr
        });
      } else {
        that.data.isLoadedAllFruit = true;  //已经全部加载完毕
        that.data.pageIndex = 1;
      }
      callback && callback();
    });
  },

  //套餐订单信息
  _getMealOrders: function (callback) {
    //TODO
    var that = this;
    var token = wx.getStorageSync('token')
    if (!token) {
      this.showTips('错误', '登录信息过期,请重试')

      return;
    }
    mealOrder.getOrders(this.data.mealPageIndex - 1, token, this.data.start,this.data.end,(res) => {
      var data = res.data;
      that.setData({
        loadingHidden: true
      });
      if (data.length > 0) {
        that.data.mealOrderArr.push.apply(that.data.mealOrderArr, data);  //数组合并
        that.setData({
          mealOrderArr: that.data.mealOrderArr
        });
      } else {
        that.data.isLoadedAllMeal = true;  //已经全部加载完毕
        that.data.mealPageIndex = 1;
      }
      callback && callback();
    });
  },


  /*显示水果订单的具体信息*/
  showOrderDetailInfo: function (event) {
    var id = order.getDataSet(event, 'id');
    wx.navigateTo({
      url: '../order/order?from=order&orderId=' + id
    });
  },

  showMealOrderDetailInfo: function (event) {
    var id = order.getDataSet(event, 'id');
    wx.navigateTo({
      url: '../meal-order/meal-order?from=order&orderId=' + id
    });
  },

  /*水果未支付订单再次支付*/
  rePay: function (event) {
    var id = order.getDataSet(event, 'id'),
      index = order.getDataSet(event, 'index');

    //online 上线实例，屏蔽支付功能
    if (order.onPay) {
      this._execPay(id, index);
    } else {
      this.showTips('支付提示', '本产品仅用于演示，支付系统已屏蔽');
    }
  },

  /*水果支付*/
  _execPay: function (id, index) {
    var that = this;
    order.execPay(id, (statusCode) => {
      if (statusCode > 0) {
        var flag = statusCode == 2;

        //更新订单显示状态
        if (flag) {
          that.data.orderArr[index].payStatus = 1;
          that.setData({
            orderArr: that.data.orderArr
          });
        }

        //跳转到 成功页面
        wx.navigateTo({
          url: '../pay-result/pay-result?orderId=' + id + '&flag=' + flag + '&from=my'
        });
      } else {
        that.showTips('支付失败', '');
      }
    });
  },

  /*水套餐未支付订单再次支付*/
  mealRePay: function (event) {
    var id = order.getDataSet(event, 'id'),
      index = order.getDataSet(event, 'index');

    //online 上线实例，屏蔽支付功能
    if (order.onPay) {
      this._mealExecPay(id, index);
    } else {
      this.showTips('支付提示', '本产品仅用于演示，支付系统已屏蔽');
    }
  },

  /*水果支付*/
  _mealExecPay: function (id, index) {
    var that = this;
    mealOrder.execPay(id, (statusCode) => {
      if (statusCode > 0) {
        var flag = statusCode == 2;

        //更新订单显示状态
        if (flag) {
          that.data.mealOrderArr[index].payStatus = 1;
          that.setData({
            mealOrderArr: that.data.mealOrderArr
          });
        }

        //跳转到 成功页面
        wx.navigateTo({
          url: '../pay-result/pay-result?orderId=' + id + '&flag=' + flag + '&from=my'
        });
      } else {
        that.showTips('支付失败', '');
      }
    });
  },

  /*下拉刷新页面*/
  onPullDownRefresh: function () {
    var that = this;
    this.data.orderArr = [];  //订单初始化
    this._getOrders(() => {
      that.data.isLoadedAllFruit = false;  //是否加载完全
      that.data.pageIndex = 1;
      wx.stopPullDownRefresh();
      order.execSetStorageSync(false);  //更新标志位
    });
    this._getMealOrders(() => {
      that.data.isLoadedAllMeal = false;  //是否加载完全
      that.data.mealPageIndex = 1;
      wx.stopPullDownRefresh();
      order.execSetStorageSync(false);  //更新标志位
    });
  },


  onReachBottom: function () {
    //加载更多水果订单
    if (activeIndex==1){
      if (!this.data.isLoadedAllFruit) {
        this.data.pageIndex++;
        this._getOrders();
      }
    }
    if (activeIndex == 0) {
      if (!this.data.isLoadedAllMeal) {
        this.data.mealPageIndex++;
        this._getMealOrders();
      }
    }
  },

  /*
   * 提示窗口
   * params:
   * title - {string}标题
   * content - {string}内容
   * flag - {bool}是否跳转到 "我的页面"
   */
  showTips: function (title, content) {
    wx.showModal({
      title: title,
      content: content,
      showCancel: false,
      success: function (res) {
        wx.redirectTo({
          url: '../start/start',
        })
      }
    });
  },

  //取消水果订单
  _cancel: function (event) {
    var that = this;
    var id = order.getDataSet(event, 'id'),
      index = order.getDataSet(event, 'index');
    order.cancel(id, (data) => {
      if (data.code == 0) {
        that.data.orderArr[index].payStatus = -1;
        that.data.orderArr[index].orderStatus = 2;
        that.setData({
          orderArr: that.data.orderArr
        });
        that.onPullDownRefresh()
      } else {
        that.showTips('错误', '取消失败');
      }
    });
  },

  //取消套餐订单
  _mealCancel: function (event) {
    var that = this;
    var id = mealOrder.getDataSet(event, 'id'),
      index = order.getDataSet(event, 'index');
    mealOrder.cancel(id, (data) => {
      if (data.code == 0) {
        that.data.orderArr[index].payStatus = -1;
        that.data.orderArr[index].orderStatus = 2;
        that.setData({
          orderArr: that.data.orderArr
        });
        that.onPullDownRefresh()
      } else {
        that.showTips('错误', '取消失败');
      }
    });
  },
  //编辑信息
  editUserInfo: function () {
    wx.navigateTo({
      url: '../edit/edit',
    })
  },
  tabClick: function (e) {
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
  }
})