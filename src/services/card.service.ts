import { Types } from 'mongoose';
import { Card } from '../models/Card.model';
import { Account } from '../models/Account.model';
import { ICard } from '../interfaces/IUser';

export class CardService {
  
  // CREATE CARD
  async createCard(cardData: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    type: 'Visa' | 'Mastercard';
    dailyLimit: number;
    accountId: string;
  }) {
    // Vérifier si le compte existe
    if (!Types.ObjectId.isValid(cardData.accountId)) {
      throw new Error('ID de compte invalide');
    }

    const account = await Account.findById(cardData.accountId);
    if (!account) {
      throw new Error('Compte non trouvé');
    }

    // Vérifier si le numéro de carte existe déjà
    const existingCard = await Card.findOne({ cardNumber: cardData.cardNumber });
    if (existingCard) {
      throw new Error('Ce numéro de carte est déjà utilisé');
    }

    // Créer la carte (status 'blocked' par défaut)
    const card = new Card({
      ...cardData,
      status: 'blocked',
      usedToday: 0
    });

    await card.save();

    // Ajouter la carte au compte
    if (!account.cards) {
      account.cards = [];
    }
    account.cards.push(card._id);
    await account.save();

    const cardResponse = card.toObject();
    
    return {
      success: true,
      message: 'Carte créée avec succès',
      data: {
        ...cardResponse,
        id: cardResponse._id,
        _id: undefined,
        __v: undefined
      }
    };
  }

  // GET CARDS BY ACCOUNT
  async getCardsByAccount(accountId: string) {
    if (!Types.ObjectId.isValid(accountId)) {
      throw new Error('ID de compte invalide');
    }

    const account = await Account.findById(accountId).populate('cards');
    
    if (!account) {
      throw new Error('Compte non trouvé');
    }

    const cards = account.cards || [];

    return {
      success: true,
      data: cards.map(card => {
        const cardObj = (card as any).toObject();
        return {
          ...cardObj,
          id: cardObj._id,
          _id: undefined,
          __v: undefined
        };
      })
    };
  }

  // DELETE CARD BY ACCOUNT
  async deleteCardByAccount(cardId: string, accountId: string) {
    if (!Types.ObjectId.isValid(cardId) || !Types.ObjectId.isValid(accountId)) {
      throw new Error('ID invalide');
    }

    // Vérifier si la carte existe
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error('Carte non trouvée');
    }

    // Retirer la carte du compte
    const account = await Account.findById(accountId);
    if (account && account.cards) {
      account.cards = account.cards.filter(id => id.toString() !== cardId);
      await account.save();
    }

    // Supprimer la carte
    await Card.findByIdAndDelete(cardId);

    return {
      success: true,
      message: 'Carte supprimée avec succès'
    };
  }
}

export default new CardService();