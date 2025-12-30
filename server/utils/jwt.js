import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// 使用固定的JWT密钥，优先从环境变量读取
const JWT_SECRET = process.env.JWT_SECRET ||
    (typeof globalThis !== 'undefined' && globalThis.JWT_SECRET) ||
    'c390ea6f-8888-4cc2-b34e-a33ef10a313d';
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '7d', // 7天过期
        issuer: 'xa-note',
        audience: 'xa-note-users'
    });
}
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'xa-note',
            audience: 'xa-note-users'
        });
        return decoded;
    }
    catch (error) {
        // 只在开发环境输出详细错误信息
        if (process.env.NODE_ENV === 'development') {
            console.error('JWT verification failed:', error);
        }
        return null;
    }
}
export function generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
}
//# sourceMappingURL=jwt.js.map