export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '入住登记',
      enablePullDownRefresh: true,
      backgroundTextStyle: 'dark',
    })
  : {
      navigationBarTitleText: '入住登记',
      enablePullDownRefresh: true,
      backgroundTextStyle: 'dark',
    }
