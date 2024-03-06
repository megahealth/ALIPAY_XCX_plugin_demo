
const AppId = "";//联系插件提供商获取
const AppKey = "";//
Page({
  data: {
    loading:false,
    ble:null,
    bleClient:null,
    heartBeat:null,
    deviceInfo:null,
    mode:0,
    v2LiveSleep:null,
    v2LiveSpoMonitor:null
  },
   callBack () {
    return  {
        //  监听本机蓝牙状态变化事件。
        onAdapterStateChange: (res) => {
          console.log(
            "🚀 ~ file: index.js:54 ~ callBack ~ ble adapter state change:",
            res
          );
          // 蓝牙重新可用了，看看该采取什么操作
        },
        //蓝牙变化回调（/连接/断开）
        onConnectionStateChange: (res) => {
          // 监听低功耗蓝牙连接状态改变事件
          if (res.connected) {
            console.log("🚀 ~ file: index.js:62 ~ callBack ~ 连接蓝牙成功");
          } else {
  
          }
        },
        // 获得token
        onTokenReceived: (token) => {
          my.setStorageSync({
            key: 'token',
            data: token,
          });
          console.log("🚀 ~ file: index.js:70 ~ callBack ~ token:", token);
        },
        //摇晃提醒
        onKnockDevice: () => {
          this.loading(true,'onKnockDevice')
          console.log("🚀 ~ file: index.js:77 ~ callBack ~ onKnockDevice:");
        },
        //请求status
        onOperationStatus: (cmd, status) => {
          if(cmd===164){
            console.log('充电。充电时不可有开启命令类操作。但可同步数据')
          }
          console.log(
            "🚀 ~ file: index.js:81 ~ callBack ~ cmd, status:",
            cmd,
            status
          );
        },
        onBatteryChanged: (value, status) => {
          console.log(
            "🚀 ~ file: index.js:96 ~ callBack ~ value, status:",
            value,
            status
          );
        },
        onV2BootupTimeReceived:(item)=>{
          console.log('onV2BootupTimeReceived',item);
        },
        onEnsureBindWhenTokenNotMatch: (a) => {
          console.log("🚀 ~ file: index.js:103 ~ callBack ~ a:", a);
        },
        onError: (status) => {
          console.log("🚀 ~ file: index.js:106 ~ callBack ~ status:", status);
        },
        onCrashLogReceived: (err) => {
          console.log("🚀 ~ file: index.js:109 ~ callBack ~ err:", err);
        },
        //收取监测报告的进度
        onSyncingDataProgress: (progress) => {
          console.log("🚀 ~ file: index.js:114 ~ callBack ~ progress:", progress);
          // my.showLoading({title: progress + "%"});
          // if (progress == 100) {
          //   // my.hideLoading();
          //   this.setenableLive(true)
          // }
        },
        // 收取监测报告 reportId可以使用
        // https://raw.megahealth.cn/parse/parsemhn?objId= 进行解析报告
        onSyncMonitorDataComplete: (res) => {
          console.log("🚀 ~ file: index.js:127 ~ callBack ~ res:", res);
        },
        //没有监测数据
        onSyncNoDataOfMonitor: (res) => {
          console.log("🚀 ~ file: index.js:133 ~ callBack ~ no Data:");
          my.showToast({title: "no Data"});
        },
        //心跳包（电量/电池状态/当前模式）
        onHeartBeatReceived: (heartBeat) => {
          console.log(
            "🚀 ~ file: index.js:139 ~ callBack ~ heartBeat:",
            heartBeat
          );
          if(heartBeat.mode){
            this.setData({mode:heartBeat.mode})
          }
          this.setData({heartBeat:heartBeat})
        },
        //血氧监测实时回调
        onV2LiveSleep: (v2LiveSleep) => {
          console.log(
            "🚀 ~ file: index.js:146 ~ callBack ~ v2LiveSleep:",
            v2LiveSleep
          );
          this.setData({v2LiveSleep})
        },
        // 血氧仪实时回调
        onV2LiveSpoMonitor: (v2LiveSpoMonitor) => {
          console.log(
            "🚀 ~ file: index.js:153 ~ callBack ~ v2LiveSpoMonitor:",
            v2LiveSpoMonitor
          );
          //实时血氧
          this.setData({v2LiveSpoMonitor})
        },
        //设置个人信息回调
        onSetUserInfo: () => {
          console.log('set info (25, 1, 180, 100, 0)');
          this.data.bleClient.setUserInfo(25, 1, 180, 100, 0);
        },
        //进入idle
        onIdle: () => {
          console.log("🚀 ~ file: index.js:167 ~ callBack ~ idle:",);
          my.hideLoading()
          //默认打开通道
          
          //查一下获取上一次的状态
          this.getMode()
        },
        //解析获取{sn、mac}
        onDeviceInfoUpdated: (info) => {
          this.setData({deviceInfo:{...this.data.deviceInfo,...info}})
          console.log("🚀 ~ file: index.js:171 ~ callBack ~ info:", info);
        },
        //拿到连接后拿到之前的mode状态
        onV2ModeReceived: (info) => {
          // if(info.mode===0||info.mode===3){
          //   //默认开启血氧实时
          //   this.setenableLive(true)
          // }
          this.setData({mode:info.mode})
          console.log("🚀 ~ file: index.js:180 ~ callBack ~ info:", info);
        },
        onReportError: () => {
          console.log("🚀 ~ file: index.js:185 ~ callBack ~ error report:");
        },
      }
   },
  loading(enable,title){
    if(enable){
      my.showLoading({
        content: title,
        success: function(res) {},
        fail: function(err) {}
      });
    }else{
      my.hideLoading()
    }
  },
  //开启血氧实时模式
  setenableLive(enable){
    this.data.bleClient.enableLive(enable);
    this.setData({mode:4})
    this.getMode()
  },
  getMode(){
    this.data.bleClient.getV2Model();
  },
  openLive(){
    this.data.bleClient.enableRealTimeNotify(true)
  },
  closeLive(){
    this.data.bleClient.enableRealTimeNotify(false)
  },
  openSpo2(){
    this.setenableLive(true)
  },
  closeSpo2(){
    this.setenableLive(false)
  },
  openSleep(){
    //开启监测
    this.data.bleClient.enableMonitor(true);
    this.setData({mode:1})
  },
  closeSleep(){
    //关闭监测
    this.data.bleClient.enableMonitor(false)
    // setTimeout(()=>{
    //   this.quickgetReport()
    // },100)
  },
  slowGetReport(){
    this.data.bleClient.syncData()
  },
  quickGetReport(){
    console.log(this.data.bleClient);
    this.data.bleClient.quickReport();
  },
  onLoad(query) {
    this.loading(true,'加载中。。。')
    this.setData({loading:true})
    const app=getApp()
    const { ble }  =  app.globalData
    this.setData({ble})
    const device = my.getStorageSync({key:"device"});
    //页面加载
    ble.initSdk(AppId, AppKey, my)
    .then((bleClient) => {
      bleClient.setCallback(this.callBack());
      this.setData({bleClient})
      this.connected(device.data)
    }).catch((err) => console.error('init error',err));
  },
  connected(device){
    this.data.bleClient.connect(device.name, device.deviceId, device.manufacturerData)
    .then(() => {
      this.connectToken(device);
    })
    .catch((error) => {
      console.error('connect error ' , error)
    });
  },
  async connectToken (device){
    const token = my.getStorageSync({key:"token"});
    const user = my.getStorageSync({key:"userinfo"});
    if (token.data && token.data.indexOf(",") != -1) {
      await this.data.bleClient.startWithToken(user.data.objectId, token.data);
    } else {
      //"6528e4aa35aba16b0fb7aba3"
      console.log(user,device);
      console.log(user.data.objectId, device.mac);
      await this.data.bleClient.startWithoutToken(user.data.objectId, device.mac);
    }
  },
  onReady() {
    console.log(this.data.bleClient)
    // 页面加载完成
  },
  onShow() {
    // 页面显示
  },
  onHide() {
    // 页面隐藏
  },
  onUnload() {
    // 页面被关闭
  },
  onTitleClick() {
    // 标题被点击
  },
  onPullDownRefresh() {
    // 页面被下拉
  },
  onReachBottom() {
    // 页面被拉到底部
  },
});
