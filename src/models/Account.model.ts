import mongoose, { Schema } from 'mongoose';
import { IAccount } from '../interfaces/IUser';

const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'utilisateur est requis']
    },
    accountNumber: {
      type: String,
      required: [true, 'Le numéro de compte est requis'],
      unique: true,
      trim: true
    },
    accountType: {
      type: String,
      enum: ['Current', 'Savings', 'Professional'],
      default: 'Current',
      required: true
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Le solde ne peut pas être négatif']
    },
    currency: {
      type: String,
      enum: ['EUR', 'USD', 'CAD', 'CNY', 'XOF'],
      default: 'EUR',
      required: true
    },
    iban: {
      type: String,
      required: [true, 'L\'IBAN est requis'],
      unique: true,
      trim: true
    },
    openingDate: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split('T')[0]
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'closed'],
      default: 'active',
      required: true
    },
    overdraftLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    Operations: [{
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      default: []
    }],
    virements: [{
      type: Schema.Types.ObjectId,
      ref: 'Virement',
      default: []
    }],
    virementPermanents: [{
      type: Schema.Types.ObjectId,
      ref: 'VirementPermanent',
      default: []
    }],
    cards: [{
      type: Schema.Types.ObjectId,
      ref: 'Card',
      default: []
    }]
  },
  {
    timestamps: true
  }
);

export const Account = mongoose.model<IAccount>('Account', AccountSchema);