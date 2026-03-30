export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '数据导入',
      enablePullDownRefresh: false,
    })
  : {
      navigationBarTitleText: '数据导入',
      enablePullDownRefresh: false,
    }
