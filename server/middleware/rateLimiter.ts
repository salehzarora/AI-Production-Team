import rateLimit from 'express-rate-limit';

const windowMinutes = parseInt(process.env.IMAGE_RATE_LIMIT_WINDOW_MINUTES ?? '60', 10);
const maxRequests = parseInt(process.env.IMAGE_RATE_LIMIT_MAX ?? '5', 10);

export const imageLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  limit: maxRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({
      success: false,
      error: `Rate limit exceeded — max ${maxRequests} image generations per ${windowMinutes} min per IP. Try again later.`,
    });
  },
});
