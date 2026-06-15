import { Router } from 'express';
import { createContact } from './contactController.js';

const router = Router();

router.post('/', createContact);

export default router;
