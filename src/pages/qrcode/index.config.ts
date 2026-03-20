export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '二维码',
    })
  : {
      navigationBarTitleText: '二维码',
    }
