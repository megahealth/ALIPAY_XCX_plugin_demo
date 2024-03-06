
const base = 'https://api-mhn.megahealth.cn/1.1'
const API= {
  baseOptions(params, method = 'GET') {
    let {url, data, header} = params
    const option = {
      url: base + url,
      data: data,
      method: method,
      header: {
        'content-type': 'application/json',
        'X-LC-Id': 'f82OcAshk5Q1J993fGLJ4bbs-gzGzoHsz',
        'X-LC-Key': 'O9COJzi78yYXCWVWMkLqlpp8',
        ...header
      },
    }
    return my.request(option)
  },
  get(url, data = '') {
    let option = {url, data}
    return this.baseOptions(option)
  },
  post: function (url, data, header) {
    let params = {url, data, header}
    return this.baseOptions(params, 'POST')
  },
  put: function (url, data, header) {
    let params = {url, data, header}
    return this.baseOptions(params, 'PUT')
  }
}
module.exports=API;
