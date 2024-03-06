Page({
  data: {
    list:[],
    scanClient:null
  },
  search(){
    this.data.scanClient
    .initBleAdapter()
    .then(() => {
      //开始搜索
      this.data.scanClient.scan();
      //10秒关闭搜索
      this.closeScan()
    })
    .catch((err) => {
      console.error("🚀 ~ file:index line:255 -----> err ", err);
    });
  },
  closeScan(){
    setTimeout(() => {
      this.data.scanClient.stopScan();
    }, 10000);
  },
  connect(event){
    this.closeScan()
    my.setStorageSync({
      key: 'device',
      data: event.currentTarget.dataset.item,
    });
    my.navigateTo({
      url: '/pages/index/index'  
    })
  },
  onLoad() {
    const device = my.getStorageSync({key:'device'})
    if(device.data){
      my.navigateTo({
        url: '/pages/index/index'  
      })
      return 
    }
    const app=getApp()
    const {ble }  =  app.globalData
    const {MegaBleScanner} = ble
    if(!this.data.scanClient)this.data.scanClient = new MegaBleScanner((devices) => {
      const existingItemIndex = this.data.list.findIndex((item) => item.mac === devices.mac);
      if (existingItemIndex !== -1) {
        let updatedScanList = [...this.data.list];
        updatedScanList[existingItemIndex] = devices;
        const list = updatedScanList.sort((a, b) => b.RSSI - a.RSSI)
        this.setData({list:list})
      } else {
       const list = [...this.data.list, devices].sort((a, b) => b.RSSI - a.RSSI)
       this.setData({list:list})
      }
       // console.info("🚀 ~ data:2023/11/16 file:src/pages/index/index.tsx line:220 -----> devices ", devices)
    });
  },
});
