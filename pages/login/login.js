import API from '../../utils/request'

Page({
  data: {
    phone:null,
    password:null
  },
  onLoad(query) {
    const userinfo=my.getStorageSync({key:'userinfo'})
    if(userinfo.data){
      my.navigateTo({
        url: '/pages/scan/scan' 
      })
    }
  },
  inputUserName(e){
    this.setData({phone:e.detail.value})
  },
  inputPassword(e){
    this.setData({password:e.detail.value})
  },
  onSubmit(e) {
    console.log(this.data.phone.length)
    if(!this.data.phone || this.data.phone.length<7){
      return my.alert({ title: 'please enter your phone' });
    }
    if(!this.data.password || this.data.password.length<4){
      return my.alert({ title: 'please enter your password' });
    }
    if(this.data.phone&&this.data.password){
      API.post('/login', {
        'mobilePhoneNumber': this.data.phone,
        'password': this.data.password,
      }).then(res => {
        console.log(res)
        if (res.statusCode === 200) {
          my.setStorageSync({
            key: 'userinfo',
            data: res.data,
          });
          my.navigateTo({
            url: '/pages/scan/scan' 
          })
        }
      })
    }
  },
});
