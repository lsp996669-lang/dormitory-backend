export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '云开发测试'
    })
  : { navigationBarTitleText: '云开发测试' }
