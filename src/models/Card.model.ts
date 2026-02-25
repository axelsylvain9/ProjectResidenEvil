import mongoose, { Schema } from 'mongoose';
import { ICard } from '../interfaces/IUser';

const CardSchema = new Schema<ICard>(
  {
    cardNumber: {
      type: String,
      required: [true, 'Le numéro de carte est requis'],
      unique: true,
      trim: true
    },
    cardHolder: {
      type: String,
      required: [true, 'Le titulaire de la carte est requis'],
      trim: true
    },
    expiryDate: {
      type: String,
      required: [true, 'La date d\'expiration est requise'],
      match: [/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format MM/YY requis']
    },
    type: {
      type: String,
      enum: ['Visa', 'Mastercard'],
      default: 'Visa',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
      required: true
    },
    dailyLimit: {
      type: Number,
      required: true,
      min: [0, 'La limite quotidienne doit être positive'],
      default: 1000
    },
    usedToday: {
      type: Number,
      default: 737,
      min: 0
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Le compte associé est requis']
    }
  },
  {
    timestamps: true,
  }
);


export const Card = mongoose.model<ICard>('Card', CardSchema);