import { DATABASE_SCHEMA, initializeDefaultData } from './schema.js';
export class D1Adapter {
    db = null;
    constructor() {
        // 在Cloudflare Pages环境中，D1数据库通过env.DB访问
        // 这里我们先设置为null，在initialize中获取
    }
    async initialize() {
        // 在Cloudflare Pages中，数据库绑定通过环境变量获取
        // 这需要在请求处理时传入
        if (typeof globalThis !== 'undefined' && globalThis.DB) {
            this.db = globalThis.DB;
        }
        else {
            throw new Error('D1 database binding not found. Make sure DB is bound in wrangler.toml');
        }
        // 初始化数据库结构
        await this.initializeSchema();
        console.log('D1 database initialized');
    }
    async initializeSchema() {
        // 使用共享的数据库schema
        const statements = DATABASE_SCHEMA.split(';').filter(stmt => stmt.trim());
        for (const stmt of statements) {
            if (stmt.trim()) {
                await this.db.prepare(stmt).run();
            }
        }
        // 检查是否是新数据库
        const existingSettings = await this.db.prepare('SELECT COUNT(*) as count FROM settings').first();
        const isNewDatabase = existingSettings.count === 0;
        // 使用共享的默认数据初始化函数
        await initializeDefaultData(this, isNewDatabase);
    }
    async exec(sql) {
        if (!this.db)
            throw new Error('Database not initialized');
        // D1不支持exec，需要分别执行每个语句
        const statements = sql.split(';').filter(stmt => stmt.trim());
        for (const stmt of statements) {
            if (stmt.trim()) {
                await this.db.prepare(stmt).run();
            }
        }
    }
    prepare(sql) {
        if (!this.db)
            throw new Error('Database not initialized');
        const db = this.db; // Capture the database reference
        return {
            async get(...params) {
                const stmt = db.prepare(sql);
                if (params.length > 0) {
                    return await stmt.bind(...params).first();
                }
                return await stmt.first();
            },
            async all(...params) {
                const stmt = db.prepare(sql);
                if (params.length > 0) {
                    const result = await stmt.bind(...params).all();
                    return result.results || [];
                }
                const result = await stmt.all();
                return result.results || [];
            },
            async run(...params) {
                const stmt = db.prepare(sql);
                let result;
                if (params.length > 0) {
                    result = await stmt.bind(...params).run();
                }
                else {
                    result = await stmt.run();
                }
                return {
                    changes: result.changes || 0,
                    lastInsertRowid: result.meta?.last_row_id
                };
            }
        };
    }
    async isInstalled() {
        try {
            const result = await this.prepare('SELECT value FROM settings WHERE key = ?').get('system.installed');
            return result?.value === '1';
        }
        catch (error) {
            return false;
        }
    }
    async close() {
        // D1不需要显式关闭连接
        this.db = null;
    }
    // 设置D1数据库实例（在请求处理时调用）
    setDatabase(db) {
        this.db = db;
    }
}
//# sourceMappingURL=d1.js.map