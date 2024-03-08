import { getAuthorizedUser, getXTokenUser } from '../utils/auth';

export async function authBasic(req, res, next) {
  const user = await getAuthorizedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = user;
  next();
}

export async function authXToken(req, res, next) {
  const user = await getXTokenUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = user;
  next();
}
