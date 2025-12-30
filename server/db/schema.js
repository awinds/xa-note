/**
 * 数据库表结构定义
 * 统一管理所有数据库表的创建语句和默认数据
 */
export const DATABASE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    tags TEXT,
    category_id TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    note_id TEXT,
    password TEXT,
    expires_at INTEGER,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS trash (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    tags TEXT,
    category_id TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    deleted_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL
  );
`;
/**
 * 默认设置配置
 */
export const DEFAULT_SETTINGS = {
    'language': 'zh'
};
/**
 * 默认分类数据
 */
export const DEFAULT_CATEGORIES = [
    {
        id: 'default',
        name: '默认',
        created_at: () => Date.now()
    }
];
/**
 * 默认笔记数据
 */
export const DEFAULT_NOTES = [
    {
        id: 'xa-note-welcome',
        title: 'XA Note',
        content: `# XA Note

XA Note 是一款**轻量级、可完全自托管的个人笔记系统**，由您自行部署和管理，专为注重**隐私、安全与可控性**的用户设计。系统支持 Markdown 编辑、分类管理、标签系统和全文检索，提供流畅的写作体验与清晰的知识结构。

## 🌟 核心优势

### 🔐 完全的数据控制权
- **自托管部署**：所有数据仅存储在您自己的服务器中
- **无第三方依赖**：不依赖任何云服务，确保完全的数据所有权
- **隐私保护**：数据永远不会离开您的控制范围

### 📝 强大的笔记功能
- **Markdown 编辑**：实时预览的 Markdown 编辑器，支持丰富的语法
- **分类管理**：灵活的分类系统，构建清晰的知识结构
- **标签系统**：多维度标签管理，快速定位相关笔记
- **全文检索**：强大的搜索功能，快速找到所需内容
- **数据导出**：笔记可导出为 Markdown 文件，避免数据锁定

### 🛡️ 多层安全保护
- **多种登录方式**：账号密码登录、GitHub OAuth 登录
- **安全验证**：可选图片验证码或 Cloudflare Turnstile 防护
- **锁屏保护**：支持锁屏功能，防止未授权访问
- **访问控制**：适合在个人服务器或私有环境中长期使用
- **操作审计**：完整的日志系统记录所有用户操作，提供安全审计功能

### 🔗 安全分享与备份
- **只读分享**：支持笔记分享，可设置访问密码与过期时间控制
- **WebDAV 备份**：与云存储或私有 NAS 集成，实现数据自动同步
- **长期保存**：多种备份方式确保数据安全

### 🎨 优秀的用户体验
- **响应式设计**：在桌面和移动设备上均可获得良好体验
- **主题切换**：支持深色/浅色主题切换
- **多语言支持**：中英文界面无缝切换
- **键盘快捷键**：提高操作效率
- **系统监控**：内置日志管理系统，支持操作记录查看和过滤

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| \`PORT\` | 服务端口 | \`9915\` |
| \`NODE_ENV\` | 运行环境 | \`development\` |
| \`DATABASE_PATH\` | 数据库路径 | \`./data/data.db\` |
| \`CLOUDFLARE_ENV\` | CF Pages | \`pages\` |

### 功能配置

系统提供了丰富的配置选项，包括：

- **站点设置**：站点标题、Logo、图标等
- **安全配置**：GitHub OAuth、验证码设置
- **备份配置**：WebDAV 自动备份
- **锁屏设置**：锁屏密码和超时时间
- **日志管理**：操作日志记录、查看和清理设置

所有配置都可以通过 Web 界面进行管理，无需修改配置文件。

## 🚀 部署

### 本地部署
支持 \`npm start\` 直接运行

### Docker部署
支持 \`docker\` 一键部署

### Cloudflare Pages部署
无成本安全可用性高 \`Cloudflare Pages\` 部署

## 🙏 致谢

感谢所有开源项目的贡献者，XA Note 使用了以下优秀的开源项目：

- React - 用户界面库
- TypeScript - 类型安全的 JavaScript
- Vite - 现代化的构建工具
- Hono - 轻量级 Web 框架
- Tailwind CSS - 实用优先的 CSS 框架
- SQLite - 嵌入式数据库

---
**XA Note** - 轻量级自托管笔记系统，您的个人知识管理伙伴 🚀`,
        tags: '',
        category_id: 'default',
        created_at: () => Date.now(),
        updated_at: () => Date.now()
    }
];
/**
 * 默认分享数据
 */
export const DEFAULT_SHARES = [
    {
        id: 'xa-note',
        note_id: 'xa-note-welcome',
        password: null,
        expires_at: null, // 永不过期
        created_at: () => Date.now()
    }
];
/**
 * 初始化数据库默认数据
 * @param adapter 数据库适配器
 * @param isNewDatabase 是否为新数据库
 */
export async function initializeDefaultData(adapter, isNewDatabase) {
    if (isNewDatabase) {
        // 全新数据库，设置默认值但不标记为已安装
        console.log('Initializing new database with defaults');
        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
            await adapter.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run(key, value, Date.now());
        }
        // 初始化默认分类
        for (const category of DEFAULT_CATEGORIES) {
            await adapter.prepare(`
        INSERT INTO categories (id, name, created_at)
        VALUES (?, ?, ?)
      `).run(category.id, category.name, category.created_at());
        }
        // 初始化默认笔记
        for (const note of DEFAULT_NOTES) {
            await adapter.prepare(`
        INSERT INTO notes (id, title, content, tags, category_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(note.id, note.title, note.content, note.tags, note.category_id, note.created_at(), note.updated_at());
        }
        console.log('Initialized default notes');
        // 初始化默认分享
        for (const share of DEFAULT_SHARES) {
            await adapter.prepare(`
        INSERT INTO shares (id, note_id, password, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(share.id, share.note_id, share.password, share.expires_at, share.created_at());
        }
        console.log('Initialized default shares');
    }
    else {
        // 现有数据库，检查是否需要添加缺失的默认设置
        for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
            const exists = await adapter.prepare('SELECT 1 FROM settings WHERE key=?').get(key);
            if (!exists) {
                await adapter.prepare(`
          INSERT INTO settings (key, value, updated_at)
          VALUES (?, ?, ?)
        `).run(key, value, Date.now());
            }
        }
        // 对于现有的数据库，如果有管理员邮箱但没有安装标记，则标记为已安装
        const hasAdmin = await adapter.prepare('SELECT 1 FROM settings WHERE key=?').get('admin.email');
        const hasInstalled = await adapter.prepare('SELECT 1 FROM settings WHERE key=?').get('system.installed');
        console.log('Existing database check:', { hasAdmin: !!hasAdmin, hasInstalled: !!hasInstalled });
        if (hasAdmin && !hasInstalled) {
            await adapter.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run('system.installed', '1', Date.now());
            console.log('Marked existing database as installed');
        }
        // 确保默认分类存在
        const categoryCount = await adapter.prepare('SELECT COUNT(*) as c FROM categories').get();
        if (categoryCount.c === 0) {
            for (const category of DEFAULT_CATEGORIES) {
                await adapter.prepare(`
          INSERT INTO categories (id, name, created_at)
          VALUES (?, ?, ?)
        `).run(category.id, category.name, category.created_at());
            }
        }
        // 检查是否需要添加默认笔记（只在没有任何笔记时添加）
        const noteCount = await adapter.prepare('SELECT COUNT(*) as c FROM notes').get();
        if (noteCount.c === 0) {
            for (const note of DEFAULT_NOTES) {
                await adapter.prepare(`
          INSERT INTO notes (id, title, content, tags, category_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(note.id, note.title, note.content, note.tags, note.category_id, note.created_at(), note.updated_at());
            }
            console.log('Added default notes to existing database');
        }
        // 检查是否需要添加默认分享（检查特定的分享ID是否存在）
        for (const share of DEFAULT_SHARES) {
            const existingShare = await adapter.prepare('SELECT 1 FROM shares WHERE id=?').get(share.id);
            if (!existingShare) {
                // 确保对应的笔记存在
                const noteExists = await adapter.prepare('SELECT 1 FROM notes WHERE id=?').get(share.note_id);
                if (noteExists) {
                    await adapter.prepare(`
            INSERT INTO shares (id, note_id, password, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(share.id, share.note_id, share.password, share.expires_at, share.created_at());
                    console.log(`Added default share: ${share.id}`);
                }
            }
        }
    }
    // 验证最终的安装状态
    const finalInstallStatus = await adapter.prepare('SELECT value FROM settings WHERE key=?').get('system.installed');
    console.log('Final install status in DB:', finalInstallStatus?.value);
}
/**
 * 执行数据库schema初始化
 * @param adapter 数据库适配器
 */
export async function executeSchema(adapter) {
    // 分别执行每个CREATE TABLE语句
    const statements = DATABASE_SCHEMA.split(';').filter(stmt => stmt.trim());
    for (const stmt of statements) {
        if (stmt.trim()) {
            if (adapter.exec) {
                // SQLite adapter
                adapter.exec(stmt);
            }
            else {
                // D1 adapter
                await adapter.prepare(stmt).run();
            }
        }
    }
}
//# sourceMappingURL=schema.js.map