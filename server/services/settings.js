import db from '../db/index.js';
let settingsCache = {};
export function getSetting(key) {
    if (settingsCache[key]) {
        return settingsCache[key];
    }
    try {
        const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        const value = result?.value;
        if (value) {
            settingsCache[key] = value;
        }
        return value;
    }
    catch (error) {
        console.error('Error getting setting:', error);
        return undefined;
    }
}
export function setSetting(key, value) {
    try {
        db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value=excluded.value,
        updated_at=excluded.updated_at
    `).run(key, value, Date.now());
        // 更新缓存
        settingsCache[key] = value;
    }
    catch (error) {
        console.error('Error setting value:', error);
        throw error;
    }
}
export function getSettings(prefix) {
    try {
        const rows = prefix
            ? db.prepare(`
          SELECT key, value FROM settings
          WHERE key LIKE ?
        `).all(`${prefix}%`)
            : db.prepare('SELECT key, value FROM settings').all();
        const settings = rows.reduce((acc, r) => {
            acc[r.key] = r.value;
            settingsCache[r.key] = r.value;
            return acc;
        }, {});
        return settings;
    }
    catch (error) {
        console.error('Error getting settings:', error);
        return {};
    }
}
// 清除缓存
export function clearSettingsCache() {
    settingsCache = {};
}
//# sourceMappingURL=settings.js.map