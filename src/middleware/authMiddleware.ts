import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import crypto from 'crypto';

/**
 * Middleware de Autenticação para Endpoints Administrativos e de Métricas
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const configuredKey = config.security.adminApiKey || config.security.dashboardPassword;

  // Se estiver em modo de teste ou se nenhuma chave for configurada em ambiente de desenvolvimento
  if (!configuredKey) {
    if (config.nodeEnv === 'production') {
      res.status(401).json({
        error: 'Acesso não autorizado. Configure ADMIN_API_KEY no arquivo .env para produção.'
      });
      return;
    }
    // Em desenvolvimento permite acesso livre
    return next();
  }

  // Extrai o token de várias fontes possíveis
  const authHeader = req.headers['authorization'];
  let providedToken = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.slice(7).trim();
  } else if (req.headers['x-admin-key']) {
    providedToken = String(req.headers['x-admin-key']).trim();
  } else if (req.query['api_key'] || req.query['key']) {
    providedToken = String(req.query['api_key'] || req.query['key']).trim();
  }

  if (!providedToken || providedToken !== configuredKey) {
    res.status(401).json({
      error: 'Não autorizado. Forneça o header "Authorization: Bearer <token>" ou "x-admin-key" válido.'
    });
    return;
  }

  next();
}

/**
 * Limitador de taxa simples em memória para proteger endpoints públicos contra DoS/Spam
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function createRateLimiter(maxRequests: number = 30, windowMs: number = 60 * 1000) {
  return (req: Request, res: Response, next?: NextFunction): void => {
    // Não aplica limite em testes
    if (process.env.NODE_ENV === 'test') {
      if (typeof next === 'function') next();
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      if (typeof next === 'function') next();
      return;
    }

    record.count++;
    if (record.count > maxRequests) {
      res.status(429).json({
        error: 'Muitas requisições. Aguarde alguns instantes antes de tentar novamente.'
      });
      return;
    }

    if (typeof next === 'function') next();
  };
}

/**
 * Validador criptográfico HMAC SHA-256 para Webhooks oficiais da Meta (WhatsApp)
 */
export function verifyMetaSignature(payload: string | Buffer, signatureHeader: string | undefined, appSecret: string): boolean {
  if (!signatureHeader || !appSecret) return false;

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') return false;

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(parts[1], 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    return false;
  }
}
