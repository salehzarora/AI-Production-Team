import type { Request, Response, NextFunction } from 'express';

/**
 * Checks x-app-access-key header against APP_ACCESS_KEY env var.
 * Skipped entirely when APP_ACCESS_KEY is not set (placeholder / local dev mode).
 */
export function accessKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const expectedKey = process.env.APP_ACCESS_KEY;

  // Protection is off — allow all requests.
  if (!expectedKey) {
    next();
    return;
  }

  const provided = req.headers['x-app-access-key'];

  if (!provided) {
    res.status(401).json({
      success: false,
      error: 'Access key required. Set the x-app-access-key header.',
    });
    return;
  }

  if (provided !== expectedKey) {
    res.status(403).json({
      success: false,
      error: 'Invalid access key.',
    });
    return;
  }

  next();
}
