import { Router } from 'express';
import {
  createCard,
  getCardsByAccount,
  deleteCardByAccount
} from '../controllers/card.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const cardRouter = Router();

// Toutes les routes cartes sont protégées
cardRouter.use(authMiddleware);

cardRouter.post('/card', createCard);
cardRouter.get('/card/:accountId', getCardsByAccount);
cardRouter.delete('/:cardId/account/:accountId', deleteCardByAccount);

export default cardRouter;