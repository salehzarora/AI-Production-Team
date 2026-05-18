import { Router } from 'express';
import { generateImage } from '../controllers/imageController';

const router = Router();

router.post('/generate', generateImage);

export default router;
