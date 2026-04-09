/**
 * 测试添加南二巷201房3号床
 *
 * 使用方法：
 * 1. 在云开发控制台打开云函数页面
 * 2. 选择 addBed 云函数
 * 3. 点击「云端测试」
 * 4. 输入以下参数
 * 5. 点击「执行」
 */

// 测试参数
const testParams = {
  dormitory: "nantwo",  // 南二巷
  floor: 2,             // 2楼
  room: "201",          // 201房间
  bedNumber: 3          // 3号床
}

// 预期结果
const expectedSuccess = {
  code: 200,
  msg: "成功添加床位：201房3号床（上下铺）",
  data: {
    dormitory: "nantwo",
    floor: 2,
    room: "201",
    bedNumber: 3,
    positions: ["upper", "lower"]
  }
}

// 在小程序中调用
async function addBedInMiniProgram() {
  try {
    const res = await Taro.cloud.callFunction({
      name: 'addBed',
      data: testParams
    })

    console.log('添加床位结果:', res.result)

    if (res.result?.code === 200) {
      Taro.showToast({
        title: '添加成功',
        icon: 'success'
      })
    } else {
      Taro.showToast({
        title: res.result?.msg || '添加失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('添加床位失败:', error)
    Taro.showToast({
      title: '调用失败',
      icon: 'none'
    })
  }
}

// 导出测试参数（用于云开发控制台测试）
module.exports = {
  testParams,
  expectedSuccess,
  addBedInMiniProgram
}
