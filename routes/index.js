import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import { authBasic, authXToken } from '../middlewares/auth';
import FilesController from '../controllers/FilesController';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', authBasic, AuthController.getConnect);
router.get('/disconnect', authXToken, AuthController.getDisconnect);
router.get('/users/me', authXToken, UsersController.getMe);
router.post('/files', authXToken, FilesController.postUpload);
router.get('/files/:id', authXToken, FilesController.getShow);
router.get('/files', authXToken, FilesController.getIndex);
router.put('/files/:id/publish', authXToken, FilesController.putPublish);
router.put('/files/:id/unpublish', authXToken, FilesController.putUnPublish);
router.get('/files/:id/data', FilesController.getFile);

export default router;
