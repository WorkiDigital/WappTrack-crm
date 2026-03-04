
// Security utilities for webhook validation and sanitization

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};

// Rate limiting store (simple in-memory for now)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Invalid phone number format');
  }
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Basic validation - phone should be between 10-15 digits
  if (cleaned.length < 10 || cleaned.length > 15) {
    throw new Error('Phone number length invalid');
  }
  
  // Check for suspicious patterns
  if (/^0+$/.test(cleaned) || /^1+$/.test(cleaned)) {
    throw new Error('Suspicious phone number pattern');
  }
  
  return cleaned;
}

export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Limit message length to prevent abuse
  if (content.length > 5000) {
    content = content.substring(0, 5000) + '...';
  }
  
  // Remove potential HTML/script tags
  const sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  
  return sanitized;
}

export function sanitizeInstanceName(instanceName: string): string {
  if (!instanceName || typeof instanceName !== 'string') {
    throw new Error('Invalid instance name');
  }
  
  // Allow only alphanumeric characters, hyphens, and underscores
  const sanitized = instanceName.replace(/[^a-zA-Z0-9_-]/g, '');
  
  if (sanitized.length === 0 || sanitized.length > 100) {
    throw new Error('Instance name invalid format');
  }
  
  return sanitized;
}

export function logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') {
  const timestamp = new Date().toISOString();
  console.log(`🔒 [SECURITY-${severity.toUpperCase()}] ${timestamp}: ${event}`, {
    ...details,
    severity,
    timestamp
  });
}

export function validateWebhookPayload(body: any): boolean {
  if (!body || typeof body !== 'object') {
    logSecurityEvent('Invalid webhook payload format', { body }, 'high');
    return false;
  }
  
  if (!body.event || !body.instance) {
    logSecurityEvent('Missing required webhook fields', { body }, 'medium');
    return false;
  }
  
  return true;
}
