-- SQLite 数据库初始化脚本
-- 创建所有必要的表

-- 入住记录表
CREATE TABLE IF NOT EXISTS check_ins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  floor INTEGER NOT NULL,
  bed_number INTEGER NOT NULL,
  position TEXT NOT NULL,
  dormitory TEXT NOT NULL,
  station TEXT,
  check_in_date TEXT NOT NULL,
  is_flagged INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 床位表
CREATE TABLE IF NOT EXISTS beds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  floor INTEGER NOT NULL,
  bed_number INTEGER NOT NULL,
  position TEXT NOT NULL,
  dormitory TEXT NOT NULL,
  is_occupied INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 搬离记录表
CREATE TABLE IF NOT EXISTS check_outs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_in_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  floor INTEGER NOT NULL,
  bed_number INTEGER NOT NULL,
  position TEXT NOT NULL,
  dormitory TEXT NOT NULL,
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 点名记录表
CREATE TABLE IF NOT EXISTS rollcalls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  floor INTEGER NOT NULL,
  bed_number INTEGER NOT NULL,
  position TEXT NOT NULL,
  dormitory TEXT NOT NULL,
  status TEXT NOT NULL,
  rollcall_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  floor INTEGER NOT NULL,
  bed_number INTEGER NOT NULL,
  position TEXT NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  dormitory TEXT,
  check_in_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 插入南四巷的床位（2-4楼）
INSERT OR IGNORE INTO beds (floor, bed_number, position, dormitory) VALUES
(2, 1, 'lower', 'nansi'), (2, 2, 'lower', 'nansi'), (2, 3, 'lower', 'nansi'), (2, 4, 'lower', 'nansi'), (2, 5, 'lower', 'nansi'),
(2, 6, 'lower', 'nansi'), (2, 7, 'lower', 'nansi'), (2, 8, 'lower', 'nansi'), (2, 9, 'lower', 'nansi'), (2, 10, 'lower', 'nansi'),
(2, 11, 'lower', 'nansi'), (2, 12, 'lower', 'nansi'), (2, 13, 'lower', 'nansi'), (2, 14, 'lower', 'nansi'), (2, 15, 'lower', 'nansi'),
(2, 1, 'upper', 'nansi'), (2, 2, 'upper', 'nansi'), (2, 3, 'upper', 'nansi'), (2, 4, 'upper', 'nansi'), (2, 5, 'upper', 'nansi'),
(2, 6, 'upper', 'nansi'), (2, 7, 'upper', 'nansi'), (2, 8, 'upper', 'nansi'), (2, 9, 'upper', 'nansi'), (2, 10, 'upper', 'nansi'),
(2, 11, 'upper', 'nansi'), (2, 12, 'upper', 'nansi'), (2, 13, 'upper', 'nansi'), (2, 14, 'upper', 'nansi'), (2, 15, 'upper', 'nansi'),
(3, 1, 'lower', 'nansi'), (3, 2, 'lower', 'nansi'), (3, 3, 'lower', 'nansi'), (3, 4, 'lower', 'nansi'), (3, 5, 'lower', 'nansi'),
(3, 6, 'lower', 'nansi'), (3, 7, 'lower', 'nansi'), (3, 8, 'lower', 'nansi'), (3, 9, 'lower', 'nansi'), (3, 10, 'lower', 'nansi'),
(3, 11, 'lower', 'nansi'), (3, 12, 'lower', 'nansi'), (3, 13, 'lower', 'nansi'), (3, 14, 'lower', 'nansi'), (3, 15, 'lower', 'nansi'),
(3, 1, 'upper', 'nansi'), (3, 2, 'upper', 'nansi'), (3, 3, 'upper', 'nansi'), (3, 4, 'upper', 'nansi'), (3, 5, 'upper', 'nansi'),
(3, 6, 'upper', 'nansi'), (3, 7, 'upper', 'nansi'), (3, 8, 'upper', 'nansi'), (3, 9, 'upper', 'nansi'), (3, 10, 'upper', 'nansi'),
(3, 11, 'upper', 'nansi'), (3, 12, 'upper', 'nansi'), (3, 13, 'upper', 'nansi'), (3, 14, 'upper', 'nansi'), (3, 15, 'upper', 'nansi'),
(4, 1, 'lower', 'nansi'), (4, 2, 'lower', 'nansi'), (4, 3, 'lower', 'nansi'), (4, 4, 'lower', 'nansi'), (4, 5, 'lower', 'nansi'),
(4, 6, 'lower', 'nansi'), (4, 7, 'lower', 'nansi'), (4, 8, 'lower', 'nansi'), (4, 9, 'lower', 'nansi'), (4, 10, 'lower', 'nansi'),
(4, 11, 'lower', 'nansi'), (4, 12, 'lower', 'nansi'), (4, 13, 'lower', 'nansi'), (4, 14, 'lower', 'nansi'), (4, 15, 'lower', 'nansi'),
(4, 1, 'upper', 'nansi'), (4, 2, 'upper', 'nansi'), (4, 3, 'upper', 'nansi'), (4, 4, 'upper', 'nansi'), (4, 5, 'upper', 'nansi'),
(4, 6, 'upper', 'nansi'), (4, 7, 'upper', 'nansi'), (4, 8, 'upper', 'nansi'), (4, 9, 'upper', 'nansi'), (4, 10, 'upper', 'nansi'),
(4, 11, 'upper', 'nansi'), (4, 12, 'upper', 'nansi'), (4, 13, 'upper', 'nansi'), (4, 14, 'upper', 'nansi'), (4, 15, 'upper', 'nansi');

-- 插入南二巷的床位（3-5楼，带房号）
INSERT OR IGNORE INTO beds (floor, bed_number, position, dormitory) VALUES
(3, 1, 'lower', 'nantwo'), (3, 2, 'lower', 'nantwo'), (3, 3, 'lower', 'nantwo'), (3, 4, 'lower', 'nantwo'), (3, 5, 'lower', 'nantwo'),
(3, 6, 'lower', 'nantwo'), (3, 7, 'lower', 'nantwo'), (3, 8, 'lower', 'nantwo'), (3, 9, 'lower', 'nantwo'), (3, 10, 'lower', 'nantwo'),
(3, 1, 'upper', 'nantwo'), (3, 2, 'upper', 'nantwo'), (3, 3, 'upper', 'nantwo'), (3, 4, 'upper', 'nantwo'), (3, 5, 'upper', 'nantwo'),
(3, 6, 'upper', 'nantwo'), (3, 7, 'upper', 'nantwo'), (3, 8, 'upper', 'nantwo'), (3, 9, 'upper', 'nantwo'), (3, 10, 'upper', 'nantwo'),
(4, 1, 'lower', 'nantwo'), (4, 2, 'lower', 'nantwo'), (4, 3, 'lower', 'nantwo'), (4, 4, 'lower', 'nantwo'), (4, 5, 'lower', 'nantwo'),
(4, 6, 'lower', 'nantwo'), (4, 7, 'lower', 'nantwo'), (4, 8, 'lower', 'nantwo'), (4, 9, 'lower', 'nantwo'), (4, 10, 'lower', 'nantwo'),
(4, 1, 'upper', 'nantwo'), (4, 2, 'upper', 'nantwo'), (4, 3, 'upper', 'nantwo'), (4, 4, 'upper', 'nantwo'), (4, 5, 'upper', 'nantwo'),
(4, 6, 'upper', 'nantwo'), (4, 7, 'upper', 'nantwo'), (4, 8, 'upper', 'nantwo'), (4, 9, 'upper', 'nantwo'), (4, 10, 'upper', 'nantwo'),
(5, 1, 'lower', 'nantwo'), (5, 2, 'lower', 'nantwo'), (5, 3, 'lower', 'nantwo'), (5, 4, 'lower', 'nantwo'), (5, 5, 'lower', 'nantwo'),
(5, 6, 'lower', 'nantwo'), (5, 7, 'lower', 'nantwo'), (5, 8, 'lower', 'nantwo'), (5, 9, 'lower', 'nantwo'), (5, 10, 'lower', 'nantwo'),
(5, 1, 'upper', 'nantwo'), (5, 2, 'upper', 'nantwo'), (5, 3, 'upper', 'nantwo'), (5, 4, 'upper', 'nantwo'), (5, 5, 'upper', 'nantwo'),
(5, 6, 'upper', 'nantwo'), (5, 7, 'upper', 'nantwo'), (5, 8, 'upper', 'nantwo'), (5, 9, 'upper', 'nantwo'), (5, 10, 'upper', 'nantwo');
