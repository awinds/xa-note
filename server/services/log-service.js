import db from '../db/index.js';
export class LogService {
    /**
     * 记录日志
     */
    static async log(params) {
        try {
            const id = crypto.randomUUID();
            const created_at = Date.now();
            const logEntry = {
                id,
                created_at,
                user_id: params.user_id,
                action: params.action,
                target_type: params.target_type,
                target_id: params.target_id,
                details: params.details ? JSON.stringify(params.details) : undefined,
                ip_address: params.ip_address,
                user_agent: params.user_agent
            };
            await db.prepare(`
        INSERT INTO logs (id, user_id, action, target_type, target_id, details, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(logEntry.id, logEntry.user_id, logEntry.action, logEntry.target_type, logEntry.target_id, logEntry.details, logEntry.ip_address, logEntry.user_agent, logEntry.created_at);
        }
        catch (error) {
            console.error('Failed to log action:', error);
            // 日志记录失败不应该影响主要功能
        }
    }
    /**
     * 获取日志列表
     */
    static async getLogs(params) {
        const { user_id, limit = 50, offset = 0, action, target_type, start_date, end_date } = params;
        let whereClause = 'WHERE user_id = ?';
        const queryParams = [user_id];
        if (action) {
            whereClause += ' AND action = ?';
            queryParams.push(action);
        }
        if (target_type) {
            whereClause += ' AND target_type = ?';
            queryParams.push(target_type);
        }
        if (start_date) {
            whereClause += ' AND created_at >= ?';
            queryParams.push(start_date);
        }
        if (end_date) {
            whereClause += ' AND created_at <= ?';
            queryParams.push(end_date);
        }
        // 获取总数
        const totalResult = await db.prepare(`
      SELECT COUNT(*) as count FROM logs ${whereClause}
    `).get(...queryParams);
        const total = totalResult.count;
        // 获取日志列表
        const logs = await db.prepare(`
      SELECT * FROM logs ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...queryParams, limit, offset);
        // 解析details字段
        const parsedLogs = logs.map(log => ({
            ...log,
            details: log.details ? JSON.parse(log.details) : undefined
        }));
        return { logs: parsedLogs, total };
    }
    /**
     * 清理旧日志
     */
    static async cleanOldLogs(daysToKeep = 90) {
        const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        const result = await db.prepare(`
      DELETE FROM logs WHERE created_at < ?
    `).run(cutoffTime);
        return result.changes;
    }
    /**
     * 获取日志统计
     */
    static async getLogStats(user_id, days = 30) {
        const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        // 总日志数
        const totalResult = await db.prepare(`
      SELECT COUNT(*) as count FROM logs 
      WHERE user_id = ? AND created_at >= ?
    `).get(user_id, startTime);
        // 按操作类型统计
        const actionResults = await db.prepare(`
      SELECT action, COUNT(*) as count FROM logs 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY action
      ORDER BY count DESC
    `).all(user_id, startTime);
        const actionStats = {};
        actionResults.forEach(row => {
            actionStats[row.action] = row.count;
        });
        // 按日期统计 - 使用兼容的日期函数
        const dailyResults = await db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', datetime(created_at / 1000, 'unixepoch')) as date,
        COUNT(*) as count 
      FROM logs 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY date
      ORDER BY date DESC
    `).all(user_id, startTime);
        const dailyStats = dailyResults.map(row => ({
            date: row.date,
            count: row.count
        }));
        return {
            totalLogs: totalResult.count,
            actionStats,
            dailyStats
        };
    }
}
// 日志操作类型常量
export const LOG_ACTIONS = {
    // 认证相关
    LOGIN: 'login',
    LOGOUT: 'logout',
    // 笔记相关
    CREATE_NOTE: 'create_note',
    UPDATE_NOTE: 'update_note',
    DELETE_NOTE: 'delete_note',
    RESTORE_NOTE: 'restore_note',
    PERMANENT_DELETE_NOTE: 'permanent_delete_note',
    // 分享相关
    CREATE_SHARE: 'create_share',
    DELETE_SHARE: 'delete_share',
    VIEW_SHARE: 'view_share',
    // 分类相关
    CREATE_CATEGORY: 'create_category',
    UPDATE_CATEGORY: 'update_category',
    DELETE_CATEGORY: 'delete_category',
    // 设置相关
    UPDATE_SETTINGS: 'update_settings',
    // 系统相关
    EXPORT_DATA: 'export_data',
    IMPORT_DATA: 'import_data',
    BACKUP_DATA: 'backup_data'
};
//# sourceMappingURL=log-service.js.map