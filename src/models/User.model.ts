// models/user.model.ts
import mongoose, { Schema } from 'mongoose';
import { IUser } from '../interfaces/IUser';

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Le nom complet est requis'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'L\'email est requis'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide']
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit faire au moins 6 caractères'],
      select: false
    },
    phone: {
      type: String,
      required: [true, 'Le téléphone est requis'],
      unique: true,
      trim: true
    },
    cin: {
      type: String,
      required: [true, 'Le CIN est requis'],
      unique: true,
      trim: true
    },
    address: {
      type: String,
      required: [true, 'L\'adresse est requise']
    },
    lastLogin: {
      type: Date,
      default: null
    },
    compte: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      default: null
    },
    beneficiaires: [{
      type: Schema.Types.ObjectId,
      ref: 'Beneficiaire',
      default: []
    }],
      prets: [{
        type: Schema.Types.ObjectId,
        ref: 'Loan',
        default: []
      }]
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);