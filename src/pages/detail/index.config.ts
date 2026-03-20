export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '人员详情',
    })
  : {
      navigationBarTitleText: '人员详情',
    }
