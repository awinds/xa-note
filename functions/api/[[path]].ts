// Cloudflare Pages API Handler for XA Note
import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { D1Adapter } from '../../server/db/d1.js'
import { generateToken, verifyToken, generateSessionId } from '../../server/utils/jwt.js'

type Bindings = {
  DB?: any
  CLOUDFLARE_ENV?: string
  JWT_SECRET?: string
}

type Variables = {
  db: D1Adapter
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

let dbAdapter: D1Adapter | null = null

function getDatabase(env: Bindings): D1Adapter {
  if (!dbAdapter) {
    dbAdapter = new D1Adapter()
    if (env?.DB) {
      dbAdapter.setDatabase(env.DB)
    }
  }
  return dbAdapter
}

// Middleware: Initialize database
app.use('*', async (c, next) => {
  const db = getDatabase(c.env)
  try {
    await db.initialize()
  } catch (error) {
    console.error('Database initialization failed:', error)
  }
  c.set('db', db)
  await next()
})

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    platform: 'cloudflare-pages',
    timestamp: new Date().toISOString()
  })
})

// Install status check
app.get('/api/install/status', async (c) => {
  const db = c.get('db') as D1Adapter
  try {
    const isInstalled = await db.isInstalled()
    return c.json({ installed: isInstalled })
  } catch (error) {
    return c.json({ installed: false, error: 'Database check failed' })
  }
})

// Install
app.post('/api/install', async (c) => {
  const db = c.get('db') as D1Adapter
  
  try {
    const isInstalled = await db.isInstalled()
    if (isInstalled) {
      return c.json({ error: 'Already installed' }, 400)
    }

    const { siteName, adminEmail, adminPassword } = await c.req.json()

    if (!siteName || !adminEmail || !adminPassword) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const settings = [
      ['site.title', siteName],
      ['admin.email', adminEmail],
      ['admin.password', hashedPassword],
      ['system.installed', '1'],
      ['language', 'zh']
    ]

    for (const [key, value] of settings) {
      await db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)').run(key, value, Date.now())
    }

    return c.json({ success: true, message: 'Installation completed' })
  } catch (error) {
    console.error('Installation error:', error)
    return c.json({ error: 'Installation failed' }, 500)
  }
})

// Login
app.post('/api/login', async (c) => {
  const db = c.get('db') as D1Adapter
  
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ ok: false, reason: 'missing_credentials' }, 400)
    }

    const adminEmail = await db.prepare('SELECT value FROM settings WHERE key = ?').get('admin.email') as any
    const adminPassword = await db.prepare('SELECT value FROM settings WHERE key = ?').get('admin.password') as any

    if (!adminEmail || !adminPassword) {
      return c.json({ ok: false, reason: 'admin_not_configured' }, 500)
    }

    if (email !== adminEmail.value) {
      return c.json({ ok: false, error: 'email_incorrect' }, 401)
    }

    const isValidPassword = await bcrypt.compare(password, adminPassword.value)
    if (!isValidPassword) {
      return c.json({ ok: false, error: 'invalid_credentials' }, 401)
    }

    const token = generateToken({
      userId: 'admin',
      email: adminEmail.value,
      role: 'admin'
    }, c.env.JWT_SECRET)
    const sessionId = generateSessionId()

    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return c.json({ ok: true, email: adminEmail.value })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ ok: false, reason: 'server_error' }, 500)
  }
})

// Auth check
app.get('/api/me', async (c) => {
  const token = getCookie(c, 'auth_token')
  const sessionId = getCookie(c, 'session_id')

  if (!token || !sessionId) {
    return c.json({ loggedIn: false, reason: 'missing_cookies' }, 401)
  }

  const payload = verifyToken(token, c.env.JWT_SECRET)
  if (!payload) {
    return c.json({ loggedIn: false, reason: 'invalid_token' }, 401)
  }

  return c.json({ 
    loggedIn: true, 
    email: payload.email,
    role: payload.role
  })
})

// Logout
app.post('/api/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  deleteCookie(c, 'session_id', { path: '/' })
  return c.json({ ok: true })
})

// System info
app.get('/api/system/info', async (c) => {
  return c.json({
    name: 'XA Note',
    version: '1.0.0',
    platform: 'Cloudflare Pages',
    database: 'D1',
    timestamp: new Date().toISOString()
  })
})

// Settings
app.get('/api/settings', async (c) => {
  const db = c.get('db') as D1Adapter
  
  try {
    const settings = await db.prepare('SELECT key, value FROM settings').all()
    const result: Record<string, string> = {}
    
    for (const setting of settings) {
      result[setting.key] = setting.value
    }
    
    return c.json(result)
  } catch (error) {
    console.error('Get settings error:', error)
    return c.json({ error: 'Failed to get settings' }, 500)
  }
})

app.post('/api/settings', async (c) => {
  const db = c.get('db') as D1Adapter
  
  try {
    const settings = await c.req.json()
    
    for (const [key, value] of Object.entries(settings)) {
      await db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)').run(key, value, Date.now())
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return c.json({ error: 'Failed to update settings' }, 500)
  }
})

// Categories
app.get('/api/categories', async (c) => {
  const db = c.get('db') as D1Adapter
  
  try {
    const categories = await db.prepare('SELECT * FROM categories ORDER BY name').all()
    return c.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    return c.json({ error: 'Failed to get categories' }, 500)
  }
})

app.post('/api/categories', async (c) => {
  const db = c.get('db') as D1Adapter
  
  try {
    const { name } = await c.req.json()
    const id = nanoid()
    
    await db.prepare('INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)').run(id, name, Date.now())
    
    return c.json({ id, name, created_at: Date.now() })
  } catch (error) {
    console.error('Create category error:', error)
    return c.json({ error: 'Failed to create category' }, 500)
  }
})

app.put('/api/categories/:id', async (c) => {
  const db = c.get('db') as D1Adapter
  const id = c.req.param('id')
  
  try {
    const { name } = await c.req.json()
    
    await db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Update category error:', error)
    return c.json({ error: 'Failed to update category' }, 500)
  }
})

app.delete('/api/categories/:id', async (c) => {
  const db = c.get('db') as D1Adapter
  const id = c.req.param('id')
  
  try {
    // Move notes to default category
    await db.prepare('UPDATE notes SET category_id = ? WHERE category_id = ?').run('default', id)
    await db.prepare('DELETE FROM categories WHERE id = ?').run(id)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete category error:', error)
    return c.json({ error: 'Failed to delete category' }, 500)
  }
})

// Notes
app.get('/api/notes', async (c) => {
  const db = c.get('db') as D1Adapter
  const category = c.req.query('category')
  
  try {
    let query = 'SELECT * FROM notes WHERE 1=1'
    const params: any[] = []
    
    if (category && category !== 'all') {
      query += ' AND category_id = ?'
      params.push(category)
    }
    
    query += ' ORDER BY updated_at DESC'
    
    const notes = await db.prepare(query).all(...params)
    return c.json(notes)
  } catch (error) {
    console.error('Get notes error:', error)
    return c.json({ error: 'Failed to get notes' }, 500)
  }
})

app.post('/api/notes', async (c) => {
  const db = c.get('db') as D1Adapter
  
  try {
    const { categoryId } = await c.req.json()
    const id = nanoid()
    const now = Date.now()
    
    await db.prepare('INSERT INTO notes (id, title, content, tags, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, '', '', '', categoryId, now, now
    )
    
    return c.json({ id, title: '', content: '', tags: '', category_id: categoryId, created_at: now, updated_at: now })
  } catch (error) {
    console.error('Create note error:', error)
    return c.json({ error: 'Failed to create note' }, 500)
  }
})

app.put('/api/notes/:id', async (c) => {
  const db = c.get('db') as D1Adapter
  const id = c.req.param('id')
  
  try {
    const { title, content, tags, category_id } = await c.req.json()
    
    await db.prepare('UPDATE notes SET title = ?, content = ?, tags = ?, category_id = ?, updated_at = ? WHERE id = ?').run(
      title, content, tags, category_id, Date.now(), id
    )
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Update note error:', error)
    return c.json({ error: 'Failed to update note' }, 500)
  }
})

app.delete('/api/notes/:id', async (c) => {
  const db = c.get('db') as D1Adapter
  const id = c.req.param('id')
  
  try {
    const note = await db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as any
    if (note) {
      await db.prepare('INSERT INTO trash (id, title, content, tags, category_id, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        note.id, note.title, note.content, note.tags, note.category_id, note.created_at, note.updated_at, Date.now()
      )
      await db.prepare('DELETE FROM notes WHERE id = ?').run(id)
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete note error:', error)
    return c.json({ error: 'Failed to delete note' }, 500)
  }
})

// Search
app.get('/api/search', async (c) => {
  const db = c.get('db') as D1Adapter
  const q = c.req.query('q')
  
  if (!q) {
    return c.json([])
  }
  
  try {
    const notes = await db.prepare('SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC').all('%' + q + '%', '%' + q + '%')
    return c.json(notes)
  } catch (error) {
    console.error('Search error:', error)
    return c.json({ error: 'Search failed' }, 500)
  }
})

// Shares
app.post('/api/share/:id', async (c) => {
  const db = c.get('db') as D1Adapter
  const noteId = c.req.param('id')
  
  try {
    const { password, expiresAt } = await c.req.json()
    const shareId = nanoid()
    
    await db.prepare('INSERT INTO shares (id, note_id, password, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
      shareId, noteId, password || null, expiresAt || null, Date.now()
    )
    
    return c.json({ id: shareId })
  } catch (error) {
    console.error('Create share error:', error)
    return c.json({ error: 'Failed to create share' }, 500)
  }
})

app.post('/api/share/:code/view', async (c) => {
  const db = c.get('db') as D1Adapter
  const code = c.req.param('code')
  
  try {
    const body = await c.req.json()
    
    const share = await db.prepare('SELECT * FROM shares WHERE id = ?').get(code) as any
    if (!share) {
      return c.json({ error: 'NOT_FOUND' }, 404)
    }
    
    if (share.expires_at && Date.now() > share.expires_at) {
      return c.json({ error: 'EXPIRED' }, 403)
    }
    
    if (share.password && share.password !== body.password) {
      return c.json({ error: 'PASSWORD_REQUIRED' }, 401)
    }
    
    const note = await db.prepare('SELECT * FROM notes WHERE id = ?').get(share.note_id)
    
    return c.json(note)
  } catch (error) {
    console.error('View share error:', error)
    return c.json({ error: 'Failed to view share' }, 500)
  }
})

app.get('/api/shares', async (c) => {
  const db = c.get('db') as D1Adapter
  const noteId = c.req.query('note_id')
  
  try {
    let query = 'SELECT * FROM shares WHERE 1=1'
    const params: any[] = []
    
    if (noteId) {
      query += ' AND note_id = ?'
      params.push(noteId)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const shares = await db.prepare(query).all(...params)
    return c.json(shares)
  } catch (error) {
    console.error('Get shares error:', error)
    return c.json({ error: 'Failed to get shares' }, 500)
  }
})

// Trash
app.get('/api/trash', async (c) => {
  const db = c.get('db') as D1Adapter
  
  try {
    const trash = await db.prepare('SELECT * FROM trash ORDER BY deleted_at DESC').all()
    return c.json(trash)
  } catch (error) {
    console.error('Get trash error:', error)
    return c.json({ error: 'Failed to get trash' }, 500)
  }
})

app.post('/api/trash/:id/restore', async (c) => {
  const db = c.get('db') as D1Adapter
  const id = c.req.param('id')
  
  try {
    const trashItem = await db.prepare('SELECT * FROM trash WHERE id = ?').get(id) as any
    if (trashItem) {
      await db.prepare('INSERT INTO notes (id, title, content, tags, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        trashItem.id, trashItem.title, trashItem.content, trashItem.tags, trashItem.category_id, trashItem.created_at, Date.now()
      )
      await db.prepare('DELETE FROM trash WHERE id = ?').run(id)
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Restore from trash error:', error)
    return c.json({ error: 'Failed to restore from trash' }, 500)
  }
})

app.delete('/api/trash/:id', async (c) => {
  const db = c.get('db') as D1Adapter
  const id = c.req.param('id')
  
  try {
    await db.prepare('DELETE FROM trash WHERE id = ?').run(id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete from trash error:', error)
    return c.json({ error: 'Failed to delete from trash' }, 500)
  }
})

app.delete('/api/trash', async (c) => {
  const db = c.get('db') as D1Adapter
  
  try {
    await db.prepare('DELETE FROM trash').run()
    return c.json({ success: true })
  } catch (error) {
    console.error('Clear trash error:', error)
    return c.json({ error: 'Failed to clear trash' }, 500)
  }
})

export const onRequest = handle(app)
