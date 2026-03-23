export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '数据导出',
    })
  : {
      navigationBarTitleText: '数据导出',
    }
