// controllers/card.controller.ts
import { Request, Response } from 'express';
import CardService from '../services/card.service';

export const createCard = async (req: Request, res: Response) => {
  try {
    const {
      cardNumber,
      cardHolder,
      expiryDate,
      type,
      dailyLimit,
      accountId
    } = req.body;

    if (!cardNumber || !cardHolder || !expiryDate || !type || !dailyLimit || !accountId) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    const result = await CardService.createCard({
      cardNumber,
      cardHolder,
      expiryDate,
      type,
      dailyLimit,
      accountId
    });

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getCardsByAccount = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'ID de compte requis'
      });
    }

    const result = await CardService.getCardsByAccount(accountId as string);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteCardByAccount = async (req: Request, res: Response) => {
  try {
    const { cardId, accountId } = req.params;

    if (!cardId || !accountId) {
      return res.status(400).json({
        success: false,
        message: 'ID de carte et ID de compte requis'
      });
    }

    const result = await CardService.deleteCardByAccount(cardId as string, accountId as string);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};