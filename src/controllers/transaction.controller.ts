// controllers/transaction.controller.ts
import { Request, Response } from 'express';
import TransactionService from '../services/transaction.service';

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'ID de compte requis'
      });
    }

    const result = await TransactionService.getAllTransactions(accountId as string);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de transaction requis'
      });
    }

    const result = await TransactionService.getTransactionById(id as string);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const {
      transactionId,
      description,
      amount,
      type,
      category,
      accountId,
      userId,
      reference,
      beneficiaryName,
      status
    } = req.body;

    if (!transactionId || !description || !amount || !type || !category || !accountId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants'
      });
    }

    const result = await TransactionService.createTransaction({
      transactionId,
      description,
      amount,
      type,
      category,
      accountId,
      userId,
      reference,
      beneficiaryName,
      status
    });

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      description,
      status,
      category,
      reference,
      beneficiaryName
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de transaction requis'
      });
    }

    const updateData: any = {};
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (category) updateData.category = category;
    if (reference) updateData.reference = reference;
    if (beneficiaryName) updateData.beneficiaryName = beneficiaryName;

    const result = await TransactionService.updateTransaction(id as string, updateData);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};