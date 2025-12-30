import { SQLiteAdapter } from './sqlite.js';
let dbAdapter = null;
export function initializeDatabase() {
    if (dbAdapter) {
        return dbAdapter;
    }
    // 检查运行环境
    if (process.env.CF_PAGES || process.env.CLOUDFLARE_ENV) {
        // Cloudflare Pages 环境 - 注意：D1适配器是异步的，需要特殊处理
        console.log('Initializing D1 database adapter...');
        // D1适配器需要在Cloudflare Pages Functions中使用，不能在这里直接初始化
        throw new Error('D1 database should be initialized in Cloudflare Pages Functions context');
    }
    else {
        // 本地或Docker环境
        console.log('Initializing SQLite database adapter...');
        const sqliteAdapter = new SQLiteAdapter();
        // 同步初始化SQLite
        sqliteAdapter.initialize().catch(console.error);
        dbAdapter = sqliteAdapter;
    }
    return dbAdapter;
}
export function getDatabase() {
    if (!dbAdapter) {
        dbAdapter = initializeDatabase();
    }
    return dbAdapter;
}
// 立即初始化数据库并导出实例
const db = getDatabase();
// 兼容旧代码的默认导出 - 直接导出数据库实例
export default db;
//# sourceMappingURL=index.js.map