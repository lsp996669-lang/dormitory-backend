export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/floor/index',
    'pages/checkin/index',
    'pages/checkout/index',
    'pages/detail/index',
    'pages/qrcode/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2563eb',
    navigationBarTitleText: '宿舍管理助手',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#2563eb',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/floor/index',
        text: '楼层',
        iconPath: './assets/tabbar/building.png',
        selectedIconPath: './assets/tabbar/building-active.png',
      },
      {
        pagePath: 'pages/checkout/index',
        text: '搬离',
        iconPath: './assets/tabbar/log-out.png',
        selectedIconPath: './assets/tabbar/log-out-active.png',
      },
      {
        pagePath: 'pages/qrcode/index',
        text: '二维码',
        iconPath: './assets/tabbar/qr-code.png',
        selectedIconPath: './assets/tabbar/qr-code-active.png',
      },
    ]
  }
})
