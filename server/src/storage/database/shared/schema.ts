import { pgTable, serial, varchar, timestamp, boolean, integer, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

// 系统健康检查表（保留）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
})

// 用户表 - 存储微信用户信息和权限
export const users = pgTable(
	"users",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		openid: varchar("openid", { length: 64 }).notNull().unique(),
		nickname: varchar("nickname", { length: 128 }),
		avatar: varchar("avatar", { length: 512 }),
		isHost: boolean("is_host").default(false).notNull(),
		isApproved: boolean("is_approved").default(false).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => [
		index("users_openid_idx").on(table.openid),
	]
)

// 床位表 - 记录每个床位的基本信息
export const beds = pgTable(
	"beds",
	{
		id: serial().notNull().primaryKey(),
		floor: integer("floor").notNull(), // 楼层 1-4
		bedNumber: integer("bed_number").notNull(), // 床铺号 1-15
		position: varchar("position", { length: 10 }).notNull(), // upper/lower
		status: varchar("status", { length: 20 }).default("empty").notNull(), // empty/occupied
		createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => [
		index("beds_floor_idx").on(table.floor),
		index("beds_status_idx").on(table.status),
	]
)

// 入住记录表
export const checkIns = pgTable(
	"check_ins",
	{
		id: serial().notNull().primaryKey(),
		bedId: integer("bed_id").notNull(),
		name: varchar("name", { length: 50 }).notNull(),
		idCard: varchar("id_card", { length: 18 }).notNull(),
		phone: varchar("phone", { length: 11 }).notNull(),
		checkInTime: timestamp("check_in_time", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => [
		index("check_ins_bed_id_idx").on(table.bedId),
		index("check_ins_name_idx").on(table.name),
	]
)

// 搬离记录表
export const checkOuts = pgTable(
	"check_outs",
	{
		id: serial().notNull().primaryKey(),
		checkInId: integer("check_in_id").notNull(),
		bedId: integer("bed_id").notNull(),
		name: varchar("name", { length: 50 }).notNull(),
		idCard: varchar("id_card", { length: 18 }).notNull(),
		phone: varchar("phone", { length: 11 }).notNull(),
		checkInTime: timestamp("check_in_time", { withTimezone: true, mode: 'string' }).notNull(),
		checkOutTime: timestamp("check_out_time", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => [
		index("check_outs_bed_id_idx").on(table.bedId),
		index("check_outs_check_in_id_idx").on(table.checkInId),
		index("check_outs_name_idx").on(table.name),
	]
)

// Zod schemas for validation
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
	coerce: { date: true },
})

// User schemas
export const insertUserSchema = createCoercedInsertSchema(users).pick({
	openid: true,
	nickname: true,
	avatar: true,
})

export const updateUserSchema = createCoercedInsertSchema(users)
	.pick({
		nickname: true,
		avatar: true,
		isHost: true,
		isApproved: true,
	})
	.partial()

// CheckIn schemas
export const insertCheckInSchema = createCoercedInsertSchema(checkIns).pick({
	bedId: true,
	name: true,
	idCard: true,
	phone: true,
})

// TypeScript types
export type User = typeof users.$inferSelect
export type InsertUser = z.infer<typeof insertUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>

export type Bed = typeof beds.$inferSelect

export type CheckIn = typeof checkIns.$inferSelect
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>

export type CheckOut = typeof checkOuts.$inferSelect
