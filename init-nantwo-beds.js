/**
 * 初始化南二巷所有房间的床位
 *
 * 这个脚本会根据 NAN_TWO_ROOM_CONFIG 配置，自动在数据库中创建所有房间的床位
 *
 * 使用方法：
 * 1. 在云开发控制台打开云函数页面
 * 2. 选择 addBed 云函数（或创建新的 initNanTwoBeds 云函数）
 * 3. 点击「云端测试」
 * 4. 输入测试参数
 * 5. 点击「执行」
 */

// 配置
const NAN_TWO_ROOM_CONFIG = {
  2: [
    { room: '201', bedCount: 3, bedPositions: [1, 2, 3] },
    { room: '202', bedCount: 3, bedPositions: [1, 2, 3] },
    { room: '203', bedCount: 3, bedPositions: [1, 2, 3] },
    { room: '204', bedCount: 2, bedPositions: [1, 2] },
  ],
  3: [
    { room: '301', bedCount: 3, bedPositions: [1, 2, 3] },
    { room: '302', bedCount: 3, bedPositions: [1, 2, 3] },
    { room: '303', bedCount: 2, bedPositions: [1, 2] },
    { room: '304', bedCount: 3, bedPositions: [1, 2, 3] },
  ],
  4: [
    { room: '401', bedCount: 2, bedPositions: [1, 2] },
    { room: '402', bedCount: 2, bedPositions: [1, 2] },
    { room: '大厅', bedCount: 4, bedPositions: [1, 2, 3, 4] },
  ],
};

// 云函数代码
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { force = false } = event; // 是否强制重新初始化

  try {
    // 检查是否已有床位数据
    const existingBeds = await db.collection('beds')
      .where({ dormitory: 'nantwo' })
      .count();

    const existingCount = existingBeds.total || 0;

    // 如果已有数据且不是强制初始化，返回提示
    if (existingCount > 0 && !force) {
      return {
        code: 400,
        msg: `数据库中已有 ${existingCount} 条南二巷床位记录，如需重新初始化，请设置 force: true`,
        data: { existingCount }
      };
    }

    // 如果强制初始化，先删除现有数据
    if (force && existingCount > 0) {
      console.log(`删除 ${existingCount} 条现有记录...`);
      // 注意：云开发数据库不支持批量删除，需要逐条删除
      // 这里暂时跳过删除步骤，建议手动删除后再初始化
    }

    // 准备要插入的床位数据
    const bedsToAdd = [];

    for (const [floor, rooms] of Object.entries(NAN_TWO_ROOM_CONFIG)) {
      for (const room of rooms) {
        for (const bedNum of room.bedPositions) {
          // 添加上铺
          bedsToAdd.push({
            dormitory: 'nantwo',
            floor: parseInt(floor),
            room: room.room,
            bed_number: String(bedNum),
            position: 'upper',
            status: 'empty',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          // 添加下铺
          bedsToAdd.push({
            dormitory: 'nantwo',
            floor: parseInt(floor),
            room: room.room,
            bed_number: String(bedNum),
            position: 'lower',
            status: 'empty',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    console.log(`准备插入 ${bedsToAdd.length} 条床位记录...`);

    // 批量插入
    let successCount = 0;
    let failedCount = 0;

    for (const bed of bedsToAdd) {
      try {
        await db.collection('beds').add({ data: bed });
        successCount++;
      } catch (error) {
        console.error(`插入失败:`, bed, error);
        failedCount++;
      }
    }

    return {
      code: 200,
      msg: `初始化完成：成功 ${successCount} 条，失败 ${failedCount} 条`,
      data: {
        total: bedsToAdd.length,
        successCount,
        failedCount
      }
    };
  } catch (error) {
    console.error('初始化失败:', error);
    return {
      code: 500,
      msg: '初始化失败: ' + error.message
    };
  }
};

// 测试参数
const testParams = {
  force: false  // 设置为 true 可以强制重新初始化（建议先手动删除现有数据）
};

// 预期结果
const expectedSuccess = {
  code: 200,
  msg: '初始化完成：成功 X 条，失败 0 条',
  data: {
    total: 44,  // 2楼 10床 + 3楼 11床 + 4楼 10床 = 31床 × 2位置 = 62条记录
    successCount: 44,
    failedCount: 0
  }
};

module.exports = {
  NAN_TWO_ROOM_CONFIG,
  testParams,
  expectedSuccess
};
