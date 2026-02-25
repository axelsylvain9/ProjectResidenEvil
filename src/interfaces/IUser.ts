import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  cin: string;
  prets: Types.ObjectId[];
  address: string;
  lastLogin: Date;
  compte: Types.ObjectId;
  beneficiaires?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accountNumber: string;
  accountType: 'Current' | 'Savings' | 'Professional';
  balance: number;
  currency: 'EUR' | 'USD' | 'CAD' | 'CNY' |'XOF';
  iban: string;
  openingDate: string;
  status: 'active' | 'suspended' | 'closed';
  overdraftLimit: number;
  Operations: Types.ObjectId[];
  virements?: Types.ObjectId[];
  virementPermanents?: Types.ObjectId[];
  cards?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;

}

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  transactionId: string;
  date: Date;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  status: 'completed' | 'pending' | 'failed';
  accountId: Types.ObjectId;
  userId: Types.ObjectId;
  reference?: string;
  beneficiaryName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILoan extends Document {
  type: string;
  amount: number;
  remaining: number;
  interestRate: number;
  nextPayment: Date;
  status: 'active' | 'paid' | 'delayed';
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}



export interface ICard extends Document {
  _id: Types.ObjectId;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  type: 'Visa' | 'Mastercard';
  status: 'active' | 'blocked';
  dailyLimit: number;
  usedToday: number;  
  accountId: Types.ObjectId;
}
