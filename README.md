# 兆观ble sdk：支付宝小程序插件版

- 插件名称：megable

## 功能简介

提供与兆观公司智能指环蓝牙交互的功能

- 主要功能
  1. 血氧实时模式

     说明：实时输出，戒指自身不存储

     数据内容：血氧(SpO2)，心率(pr)，睡眠分期

  2. 血氧监测模式

     说明：实时输出，同时戒指自身存储。方便手机与戒指断开，待监测结束后，异步收取监测数据

- 推荐的App端工作流程
  - [工作流程图](https://file-mhn.megahealth.cn/62630b5d10f14ecce727/App%E4%B8%8E%E6%88%92%E6%8C%87%E4%BA%A4%E4%BA%92%E6%B5%81%E7%A8%8B%E5%9B%BE.pdf)

    这是完整功能的流程，请结合实际业务需求调整。例如：只用到血氧实时模式，就实时接收数据即可，不用考虑异步收取监测数据的问题。

## 快速开始

1. 支付宝小程序引入插件(android需要开启定位和蓝牙，iOS需要开启蓝牙)
2. 初始化sdk，得到ble client实例；client设置callback，用于接收戒指事件通知
3. 使用MegaBleScanner，进行扫描，得到目标device，扫描到device需要执行stopScan停止扫描
4. client连接device，等待连接成功
6. 绑定戒指(首次连或token不匹配，需要晃动戒指才能连上。收到token后，用token连即可跳过晃动)

- 非绑定设备状态下: client.startWithoutToken('5837288dc59e0d00577c5f9a', '0,0,0,0,0,0')
- 已绑定设备状态下: client.startWithToken('5837288dc59e0d00577c5f9a', token)
- 注意：如果token不匹配，戒指之前的监测就会停止（数据还在，收取报告会上传）。

7. 【必须】在callback的onSetUserInfo回调中，设置用户身体信息client.setUserInfo。这一步在之前设置callback时预先写好即可

   注意：如果没有设置用户信息，会当成新用户对待，每次连接戒指都会提示晃动，并且结束之前设置的监测。

8. 连接进入idle（空闲）状态，用户可以开始操作，如：收缓存在戒指中的记录、开关监测

9. （可选）解析数据，可以输出类似《兆观健康Pro》中的报告统计信息，视业务需求实现。

<!-- 用户id格式：12个byte组成的十六进制字符串，总长24。若不关心userid，可填12个"00" -->

## 初始化

> 导入库

```
// import from plugin
var blePlugin = requirePlugin("megable")

const APPID = 'Your own id'
const APPKEY = 'Your own key'

const {
  initSdk, // for the ble client; connect, send message to the device, 
  MegaBleScanner, // for scanning
  MegaBleStatus, // for onOperationStatus const
  MegaUtils, 
} = blePlugin.ble;
```

> 扫描设备蓝牙

```js
// scan 实例化MegaBleScanner获得（操作蓝牙扫秒的的一些方法，详见：下方API中的 class MegaBleScanner）
let scanner;

if (!scanner) {
    scanner = new MegaBleScanner(res => {
        // some devices have been found, you can show them in the view;
        // the device which had been found can been connected later;
    })

    // a bleAdapter must be inited;
    scanner.initBleAdapter()
        .then(() => {
            scanner.scan()
            setTimeout(() => {
                if (scanner && scanner.isScanning) scanner.stopScan()
            }, 10000)
        })
        .catch(err => console.error(err))

} else {
    if (!scanner.isScanning) {
        scanner.scan()
        setTimeout(() => {
            if (scanner && scanner.isScanning) scanner.stopScan()
        }, 10000)
    }
}


// 扫描时，请解析广播以获取真实的mac和sn，device来源于 new MegaBleScanner(res => {}) 中的res
MegaUtils.parseAdv(device.advertisData) // {mac, sn}
```

> 连接

```js
var blePlugin = requirePlugin("megable")
const {
  initSdk, // for the ble client; connect, send message to the device, 
  MegaBleScanner, // for scanning
  MegaBleStatus, // for onOperationStatus const
  MegaUtils, // 1.1.4 增加
} = blePlugin.ble;


// 首先要初始化SDK获取到client（客户端用来调用蓝牙插件的一些方法，详见：下方API中的 class MegaBleClient ）。
let client;
initSdk(APPID, APPKEY, my).then(clnt => {
  // 将初始化获取到的clnt保存到上面定义的client变量里，下面要用到。
  client = clnt;
}).catch(err => console.error(err))
})

// 设置回调函数集合给蓝牙插件，蓝牙插件对戒指进行操作产生结果后，会调用相应的客户端回调函数，将结果传给客户端。
client.setCallback(genMegaCallback());

// 回调函数，需要的回调函数及作用，详见下方API中的 mega ble callback
genMegaCallback()
{
  return {
    // 例如下面onSyncMonitorDataComplete，蓝牙将戒指里的报告数据读取完后会调用，将报告数据放到bytes里返回。
    onSyncMonitorDataComplete: (bytes, dataStopType, dataType) => {
    }
    ......
  }
}

// 上面扫描操作后会得到一个devices列表，去其中一个device进行连接，使用初始化插件的到的client中的connect方法。
//client.connect 可用来重新连接超时
client.connect(device.name, device.deviceId, device.advertisData).then(res => {
  // get cached token, '5837288dc59e0d00577c5f9a' will always be ok to use.
  // 绑定戒指(首次连或token不匹配，需要晃动戒指才能连上。收到token后，用token连即可跳过晃动)
  if (token) {
    await client.startWithToken('5837288dc59e0d00577c5f9a', token)
  } else {
    await client.startWithoutToken('5837288dc59e0d00577c5f9a', device.mac)
  }
}).catch(err => console.error(err))

```

> 上传数据、解析数据、拿到所有报告

```json
const onSyncMonitorDataComplete = (res) => {
  //拿到数据 拿到res的objectId
}

//使用上传数据获取的objectId去解析数据 
client.parseReport（objectId).then((res)=>{
})
//获取报告
const optins={
page, limit
} //分页
getReport.getReport(optins).then((res)=>{
})

```

## API

- class MegaBleScanner:
  - initBleAdapter()
  - stopScan()
  - scan()

- class MegaBleClient:
  - connect(name, deviceId, advertisData)

    连接设备

  - startWithoutToken(userId, mac) // deprecated

    用户id格式：12个byte组成的十六进制字符串，总长24。若不关心userid，可使用模板"5837288dc59e0d00577c5f9a"，或12个"00"

  - startWithToken(userId, token)

    用户id格式：12个byte组成的十六进制字符串，总长24。若不关心userid，可使用模板"5837288dc59e0d00577c5f9a"，或12个"00"

  - setUserInfo(age, gender, height, weight, stepLength)

    女(0), 男(1); 身高(cm); 体重(kg); 步长(cm)

    例：client.setUserInfo(25, 1, 170, 60, 0)

  - enableRealTimeNotify(enable)

    打开全局实时通道，接收实时数据（血氧、电量值，电量状态等），可重复调用

  - enableLive(enable)

    开启血氧实时模式

  - getV2Model()

    拿到戒指状态

  - enableMonitor(enable）

    开启血氧监测模式

  - quickReport()

    快速收取报告获取的报告id可使用https://raw.megahealth.cn/parse/parsemhn?objId=获取数据

  - syncData()

    同步血氧监测记录，只有开启血氧监测才会产生；监测结束后，电量正常或充电时，才可收取

    拿到可用来解析的报告objectId

  - getReport(option)

    option：{page:分页，limit：条数}

    拿到当前用户的所有报告

  - parseReport(objectId)

    解析对应的报告，objectId上传以及查看报告获取到的objectId

  - enableRawdata()

    调试接口，一般用不到

  - disableRawdata()

  - disconnect()

    断开连接

  - closeBluetoothAdapter()
  
    释放蓝牙资源
  
- scanner callback

- onDeviceFound(devices) {}

- mega ble callback
  - onAdapterStateChange: (res) => {}

    - 蓝牙适配器状态变化，available蓝牙是否可用，discovering蓝牙是否正在搜索
    - res={ available: true, discovering: false }

  - onConnectionStateChange: (res) => {}

    - 连接状态变化。
    - connected：false=>true（设备连接成功） false=>(设备断开连接)
    - res={ connected：true，deviceId：'BC:E5:9F:48:89:20' }

  - onBatteryChanged: (value, status) => {}

    - 电量变化 value：电量。 status：电池状态
    - status参考STATUS_BATT列表

  - onTokenReceived: (token) => {

    戒指的token

    }

    token是每次绑定唯一
    被别的设备绑了，之前的token就失效了
    只要不被别的手机绑定，token就有效。

  - onKnockDevice: () => {}

    需要ui提示晃动戒指以绑定

  - onOperationStatus: (cmd, status) => {}

    - 操作错误提示码

    见下面STATUS文档

  - onEnsureBindWhenTokenNotMatch: () => {} // deprecated

  - onError: (status) => {}

  - onCrashLogReceived: (a) => {}

  - onSyncMonitorDataComplete: (bytes, dataStopType, dataType,deviceInfo) => {}

    - 监测数据同步成功

  - onSyncNoDataOfMonitor: () => {}

    - 没有监测数据可供同步

  - onSetUserInfo: () => {}

    - 设置用户信息 【 必须预设一个用户信息，否者每次连接都会被认为是新用户 ，提示晃动戒指】

  - onSetUserInfo() { client.setUserInfo(25, 1, 170, 60, 0 ) } 年龄、性别、身高、体重、步长

  - onIdle: () => {}

  连接进入空闲
  - onDeviceInfoUpdated: deviceInfo => {},

  onidle 触发前的 onDeviceInfoUpdated，有isRunning，代表处于监测模式


- export const STATUS

```
  ERROR_BIND                      : 40000,
  STATUS_OK                       : 0x00,
  STATUS_NO_DATA                  : 0x02, // 无数据可同步
  STATUS_SLEEPID_ERR              : 0x20,
  STATUS_CMD_PARAM_CANNOT_RESOLVE : 0x21,
  STATUS_MONITOR_IS_WORKING       : 0x22,
  STATUS_RECORDS_CTRL_ERR         : 0x23, // 监测没关，监测已开启，重复操作, 记录数据操作出错
  STATUS_AFE44XX_IS_MONITORING    : 0x24, // AFE44XX已经开启，无法再开启
  STATUS_AFE44XX_IS_SPORTING      : 0x25,
  STATUS_UNKNOWN_CMD              : 0x9F,
  STATUS_RTC_ERR                  : 0xA0,
  STATUS_LOWPOWER                 : 0xA1,
  STATUS_SPO2_HR_ERR              : 0xA2,
  STATUS_FLASH_ERR                : 0xA3,
  STATUS_REFUSED                  : 0xA4, // 充电。充电时不可有开启命令类操作。但可同步数据
  STATUS_44XX_ERR                 : 0xA5,
  STATUS_GSENSOR_ERR              : 0xA6,
  STATUS_BQ25120_IS_FAULT         : 0xA7,

  STATUS_DEVICE_HW_ERR            : 0xB0,
  STATUS_RECORDS_TIME_SHORT       : 0xC0,
  STATUS_RECORDS_NO_STOP          : 0xC1,
  STATUS_DEVICE_UNKNOWN_ERR       : 0xFF,

  // 实时值状态指示 （各模式通用）
  STATUS_LIVE_VALID       : 0, // 实时值有效
  STATUS_LIVE_PREPARING   : 1, // 值准备中
  STATUS_LIVE_INVALID     : 2, // 无效/离手

  // 电量状态指示
  STATUS_BATT_NORMAL      : 0, // 电量正常
  STATUS_BATT_CHARGING    : 1, // 充电中
  STATUS_BATT_FULL        : 2, // 充满
  STATUS_BATT_LOWPOWER    : 3, // 低电
  STATUS_BATT_ERROR       : 4, // 异常
  STATUS_BATT_SHUTDOWN    : 5, // 休眠

  // mode 戒指工作模式
  MODE_MONITOR            : 1, // 监测模式(血氧)
  MODE_SPORT              : 2, // 运动模式
  MODE_DAILY              : 3, // 空闲模式
  MODE_LIVE               : 4, // 实时模式(血氧)
  MODE_BP                 : 5, // bp模式
```

**插件的使用方法**

1.引入app.json

````json
"plugins":{
      "megable":
        {
          "version":"*", //最新
          "provider":"" //插件id
        }
}
````

2.js使用

````
   const myPlugin = requirePlugin('megable');
````

3.配置url

````
https://api-mhn.megahealth.cn/   //cdk验证
https://server-mhn.megahealth.cn  //报告接口
https://raw.megahealth.cn/     //解析报告接口
````

