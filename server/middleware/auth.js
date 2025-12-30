import { getCookie, deleteCookie } from 'hono/cookie';
import { verifyToken } from '../utils/jwt.js';
export const requireAuth = async (c, next) => {
    const token = getCookie(c, 'auth_token');
    const sessionId = getCookie(c, 'session_id');
    if (!token || !sessionId) {
        return c.json({ error: 'UNAUTHORIZED' }, 401);
    }
    // 验证JWT token
    const payload = verifyToken(token);
    if (!payload) {
        // 清除无效的token
        deleteCookie(c, 'auth_token', { path: '/' });
        deleteCookie(c, 'session_id', { path: '/' });
        return c.json({ error: 'INVALID_TOKEN' }, 401);
    }
    // 将用户信息添加到上下文中
    c.set('user', payload);
    await next();
};
//# sourceMappingURL=auth.js.map