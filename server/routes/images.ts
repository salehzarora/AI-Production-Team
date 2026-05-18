import { Router } from 'express';
import { generateImage } from '../controllers/imageController';
import { accessKeyMiddleware } from '../middleware/accessKey';
import { imageLimiter } from '../middleware/rateLimiter';

const router = Router();

// Order: access key check → rate limit → handler
router.post('/generate', accessKeyMiddleware, imageLimiter, generateImage);

export default router;
