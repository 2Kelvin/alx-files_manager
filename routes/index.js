import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import { authBasic, authXToken } from '../middlewares/auth';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', authBasic, AuthController.getConnect);
router.get('/disconnect', authXToken, AuthController.getDisconnect);
router.get('/users/me', authXToken, UsersController.getMe);

export default router;
