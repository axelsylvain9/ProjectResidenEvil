// models/Virement.model.ts
import mongoose, { Schema } from 'mongoose';
import { IVirement, Beneficiaire, VirementPermanent } from '../interfaces/Ivirement';

// Schéma pour les virements
const VirementSchema = new Schema<IVirement>(
  {
    reference: {
      type: String,
      required: true,
      unique: true
    },
    date: {
      type: String,
      required: true
    },
    montant: {
      type: Number,
      required: true,
      min: 0.01
    },
    type: {
      type: String,
      enum: ['interne', 'externe', 'permanent'],
      required: true
    },
    statut: {
      type: String,
      enum: ['en_attente', 'effectue', 'echoue'],
      default: 'en_attente',
      required: true
    },
    compteSource: {
      type: String,
      required: true,
      ref: 'Account'
    },
    compteDestinataire: {
      type: String,
      required: true
    },
    nomDestinataire: {
      type: String,
      required: true
    },
    emailDestinataire: {
      type: String
    },
    banqueDestinataire: {
      type: String
    },
    motif: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Schéma pour les bénéficiaires
const BeneficiaireSchema = new Schema<Beneficiaire>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User'
    },
    nom: {
      type: String,
      required: true
    },
    compte: {
      type: String,
      required: true
    },
    banque: {
      type: String
    },
    favori: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Schéma pour les virements permanents
const VirementPermanentSchema = new Schema<VirementPermanent>(
  {
    reference: {
      type: String,
      required: true,
      unique: true
    },
    montant: {
      type: Number,
      required: true,
    },
    compteSource: {
      type: String,
      required: true,
      ref: 'Account'
    },
    compteDestinataire: {
      type: String,
      required: true
    },
    nomDestinataire: {
      type: String,
      required: true
    },
    periodicite: {
      type: String,
      enum: ['mensuel', 'trimestriel', 'annuel'],
      required: true
    },
    dateDebut: {
      type: String,
      required: true
    },
    dateFin: {
      type: String
    },
    prochaineDate: {
      type: String,
      required: true
    },
    actif: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Création et export des modèles
export const Virement =  mongoose.model<IVirement>('Virement', VirementSchema);
export const BeneficiaireViro =  mongoose.model<Beneficiaire>('Beneficiaire', BeneficiaireSchema);
export const VirementPermanentViro =  mongoose.model<VirementPermanent>('VirementPermanent', VirementPermanentSchema);