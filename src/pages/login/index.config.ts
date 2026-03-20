export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '登录',
      navigationBarBackgroundColor: '#ffffff',
    })
  : {
      navigationBarTitleText: '登录',
      navigationBarBackgroundColor: '#ffffff',
    }
