export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '入住登记',
    })
  : {
      navigationBarTitleText: '入住登记',
    }
