export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '楼层管理',
      enablePullDownRefresh: true,
      backgroundTextStyle: 'dark',
    })
  : {
      navigationBarTitleText: '楼层管理',
      enablePullDownRefresh: true,
      backgroundTextStyle: 'dark',
    }
