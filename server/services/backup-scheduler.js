import { getDatabase } from '../db/index.js';
import { CronJob } from 'cron';
class BackupScheduler {
    jobs = new Map();
    db = getDatabase();
    constructor() {
        this.initializeScheduler();
    }
    async initializeScheduler() {
        // 启动时检查并设置定时任务
        await this.updateSchedule();
    }
    async updateSchedule() {
        try {
            // 清除现有任务
            this.jobs.forEach(job => job.stop());
            this.jobs.clear();
            // 获取备份配置
            const config = await this.getBackupConfig();
            if (!config || config.frequency === 'manual') {
                return;
            }
            // 创建新的定时任务
            let cronPattern = '';
            switch (config.frequency) {
                case 'daily':
                    cronPattern = '0 0 * * *'; // 每天0点
                    break;
                case 'weekly':
                    cronPattern = '0 0 * * 1'; // 每周一0点
                    break;
                case 'monthly':
                    cronPattern = '0 0 1 * *'; // 每月1日0点
                    break;
            }
            if (cronPattern) {
                const job = new CronJob(cronPattern, async () => {
                    await this.performAutoBackup(config);
                }, null, true, 'Asia/Shanghai');
                this.jobs.set('auto-backup', job);
                console.log(`Auto backup scheduled: ${config.frequency}`);
            }
        }
        catch (error) {
            console.error('Failed to update backup schedule:', error);
        }
    }
    async getBackupConfig() {
        try {
            const frequency = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('backup.frequency');
            const webdavUrl = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('webdav.url');
            const webdavUser = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('webdav.user');
            const webdavPassword = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('webdav.password');
            if (!frequency?.value || !webdavUrl?.value || !webdavUser?.value || !webdavPassword?.value) {
                return null;
            }
            return {
                frequency: frequency.value,
                webdavUrl: webdavUrl.value,
                webdavUser: webdavUser.value,
                webdavPassword: webdavPassword.value
            };
        }
        catch (error) {
            console.error('Failed to get backup config:', error);
            return null;
        }
    }
    async performAutoBackup(config) {
        try {
            console.log('Starting auto backup...');
            // 执行笔记备份
            await this.backupNotes(config);
            // 执行数据库备份
            await this.backupDatabase(config);
            // 更新最后备份时间
            await this.updateLastBackupTime();
            console.log('Auto backup completed successfully');
        }
        catch (error) {
            console.error('Auto backup failed:', error);
        }
    }
    async backupNotes(config) {
        // 这里复用现有的备份逻辑
        const notes = this.db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all();
        const categories = this.db.prepare('SELECT * FROM categories').all();
        // 创建备份内容
        const backupData = {
            notes,
            categories,
            exportTime: new Date().toISOString()
        };
        const content = JSON.stringify(backupData, null, 2);
        const fileName = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
        // 上传到WebDAV
        await this.uploadToWebDAV(config, fileName, content);
    }
    async backupDatabase(config) {
        // 简化的数据库备份 - 导出为JSON格式
        const tables = ['settings', 'categories', 'notes', 'shares', 'trash'];
        const backupData = {};
        for (const table of tables) {
            try {
                backupData[table] = this.db.prepare(`SELECT * FROM ${table}`).all();
            }
            catch (error) {
                console.warn(`Failed to backup table ${table}:`, error);
                backupData[table] = [];
            }
        }
        const content = JSON.stringify(backupData, null, 2);
        const fileName = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
        await this.uploadToWebDAV(config, fileName, content);
    }
    async uploadToWebDAV(config, fileName, content) {
        const url = config.webdavUrl.endsWith('/') ? config.webdavUrl : config.webdavUrl + '/';
        const fileUrl = url + fileName;
        const auth = Buffer.from(`${config.webdavUser}:${config.webdavPassword}`).toString('base64');
        const response = await fetch(fileUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: content
        });
        if (!response.ok) {
            throw new Error(`WebDAV upload failed: ${response.status} ${response.statusText}`);
        }
    }
    async updateLastBackupTime() {
        try {
            const now = new Date().toISOString();
            this.db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `).run('backup.last_backup', now, Date.now());
        }
        catch (error) {
            console.error('Failed to update last backup time:', error);
        }
    }
    stop() {
        this.jobs.forEach(job => job.stop());
        this.jobs.clear();
    }
}
export const backupScheduler = new BackupScheduler();
//# sourceMappingURL=backup-scheduler.js.map