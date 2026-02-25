import mongoose, { Schema } from 'mongoose';
import { ILoan } from '../interfaces/IUser';


const LoanSchema = new Schema<ILoan>(
  {
    type: {
      type: String,
      required: [true, 'Le type de prêt est requis'],
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Le montant doit être supérieur à 0']
    },
    remaining: {
      type: Number,
      required: true,
      min: [0, 'Le montant restant ne peut pas être négatif']
    },
    interestRate: {
      type: Number,
      required: true,
      min: [0, 'Le taux d\'intérêt ne peut pas être négatif'],
      max: [100, 'Le taux d\'intérêt maximum est 100%']
    },
    nextPayment: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'paid', 'delayed'],
      default: 'active',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const Loan = mongoose.model<ILoan>('Loan', LoanSchema);