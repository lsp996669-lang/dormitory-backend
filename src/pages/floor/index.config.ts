export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '楼层管理',
    })
  : {
      navigationBarTitleText: '楼层管理',
    }
