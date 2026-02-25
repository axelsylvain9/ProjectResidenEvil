import mongoose, { Schema } from 'mongoose';
import { ITransaction } from '../interfaces/IUser';

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: [true, 'L\'ID de transaction est requis'],
      unique: true,
      trim: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    description: {
      type: String,
      required: [true, 'La description est requise'],
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Le montant doit être supérieur à 0']
    },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: true
    },
    category: {
      type: String,
      required: [true, 'La catégorie est requise'],
      trim: true
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'pending',
      required: true
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reference: {
      type: String,
      trim: true
    },
    beneficiaryName: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);