import { Types } from 'mongoose';
import { Transaction } from '../models/Transaction.model';
import { Account } from '../models/Account.model';
import { ITransaction } from '../interfaces/IUser';

export class TransactionService {
  
  // GET ALL TRANSACTIONS (pour un compte spécifique)
  async getAllTransactions(accountId: string) {
    if (!Types.ObjectId.isValid(accountId)) {
      throw new Error('ID de compte invalide');
    }

    const transactions = await Transaction.find({ accountId })
      .sort({ date: -1 });

    return {
      success: true,
      data: transactions.map(tx => {
        const txObj = tx.toObject();
        return {
          ...txObj,
          id: txObj._id,
          _id: undefined,
          __v: undefined
        };
      })
    };
  }

  // GET TRANSACTION BY ID
  async getTransactionById(transactionId: string) {
    if (!Types.ObjectId.isValid(transactionId)) {
      throw new Error('ID de transaction invalide');
    }

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      throw new Error('Transaction non trouvée');
    }

    const transactionResponse = transaction.toObject();
    
    return {
      success: true,
      data: {
        ...transactionResponse,
        id: transactionResponse._id,
        _id: undefined,
        __v: undefined
      }
    };
  }

  // CREATE TRANSACTION
  async createTransaction(transactionData: {
    transactionId: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    category: string;
    accountId: string;
    userId: string;
    reference?: string;
    beneficiaryName?: string;
    status?: 'completed' | 'pending' | 'failed';
  }) {
    // Vérifier seulement si le compte existe (pour l'intégrité référentielle)
    if (!Types.ObjectId.isValid(transactionData.accountId)) {
      throw new Error('ID de compte invalide');
    }

    const account = await Account.findById(transactionData.accountId);
    if (!account) {
      throw new Error('Compte non trouvé');
    }

    // Créer la transaction
    const transaction = new Transaction({
      ...transactionData,
      status: transactionData.status || 'pending',
      date: new Date()
    });

    await transaction.save();

    // Ajouter la transaction à la liste Operations du compte
    account.Operations.push(transaction._id);
    await account.save();

    const transactionResponse = transaction.toObject();
    
    return {
      success: true,
      message: 'Transaction créée avec succès',
      data: {
        ...transactionResponse,
        id: transactionResponse._id,
        _id: undefined,
        __v: undefined
      }
    };
  }

  // UPDATE TRANSACTION
  async updateTransaction(
    transactionId: string, 
    updateData: Partial<Pick<ITransaction, 'description' | 'status' | 'category' | 'reference' | 'beneficiaryName'>>
  ) {
    if (!Types.ObjectId.isValid(transactionId)) {
      throw new Error('ID de transaction invalide');
    }

    // Seuls ces champs sont modifiables
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      throw new Error('Transaction non trouvée');
    }

    const transactionResponse = transaction.toObject();
    
    return {
      success: true,
      message: 'Transaction mise à jour avec succès',
      data: {
        ...transactionResponse,
        id: transactionResponse._id,
        _id: undefined,
        __v: undefined
      }
    };
  }
}

export default new TransactionService();