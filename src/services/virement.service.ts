// services/virement.service.ts
import { Types } from 'mongoose';
import { Virement } from '../models/Virement.model';
import { Account } from '../models/Account.model';
import { IVirement } from '../interfaces/Ivirement';
import transactionService from './transaction.service';
import { emailService } from './sendEmail';
import { User } from '../models/User.model';

export class VirementService {
  
  // Générer une référence unique
  private async generateReference(): Promise<string> {
    const prefix = 'VIR';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const reference = `${prefix}${date}${random}`;
    
    const existing = await Virement.findOne({ reference });
    if (existing) {
      return this.generateReference();
    }
    return reference;
  }

  // CREATE VIREMENT
  async createVirement(virementData: {
    compteSource: string;      // accountNumber
    compteDestinataire: string; // accountNumber ou RIB
    montant: number;
    type: 'interne' | 'externe' | 'permanent';
    nomDestinataire: string;
    banqueDestinataire?: string;
    motif?: string;
  }) {
    // 1. Vérifier le compte source
    const sourceAccount = await Account.findOne({ 
      accountNumber: virementData.compteSource,
      status: 'active' 
    });

    if (!sourceAccount) {
      throw new Error('Compte source introuvable ou inactif');
    }

    // 2. Vérifier le solde (en tenant compte du découvert autorisé)
    const disponible = sourceAccount.balance + (sourceAccount.overdraftLimit || 0);
    if (virementData.montant > disponible) {
      throw new Error('Solde insuffisant pour effectuer ce virement');
    }

    // 3. Si c'est un virement interne, chercher le compte destinataire
    let destinationAccount = null;
    if (virementData.type === 'interne') {
      destinationAccount = await Account.findOne({ 
        accountNumber: virementData.compteDestinataire 
      });

      if (!destinationAccount) {
        throw new Error('Compte destinataire introuvable pour un virement interne');
      }
    }

    // 4. Générer la référence
    const reference = await this.generateReference();

    // 5. IMPACTER LES SOLDES
    sourceAccount.balance -= virementData.montant;
    await sourceAccount.save();

    if (destinationAccount) {
      destinationAccount.balance += virementData.montant;
      await destinationAccount.save();
    }

    // 6. Créer le virement
    const virement = new Virement({
      reference,
      date: new Date().toISOString(),
      montant: virementData.montant,
      type: virementData.type,
      statut: 'effectue',
      compteSource: virementData.compteSource,
      compteDestinataire: virementData.compteDestinataire,
      nomDestinataire: virementData.nomDestinataire,
      banqueDestinataire: virementData.banqueDestinataire,
      motif: virementData.motif
    });

    await virement.save();

    // 7. Ajouter le virement aux comptes
    if (!sourceAccount.virements) sourceAccount.virements = [];
    sourceAccount.virements.push(virement._id as Types.ObjectId);
    await sourceAccount.save();

    if (destinationAccount) {
      if (!destinationAccount.virements) destinationAccount.virements = [];
      destinationAccount.virements.push(virement._id as Types.ObjectId);
      await destinationAccount.save();
    }

    // 8. CRÉER LES TRANSACTIONS ASSOCIÉES
    // Transaction débit pour le compte source
    await transactionService.createTransaction({
      transactionId: `TXN-${Date.now()}`,
      description: `Virement ${virementData.type === 'interne' ? 'interne' : 'externe'} vers ${virementData.nomDestinataire}`,
      amount: virementData.montant,
      type: 'debit',
      category: 'Virement',
      accountId: sourceAccount._id.toString(),
      userId: sourceAccount.userId.toString(),
      reference: virement.reference,
      beneficiaryName: virementData.nomDestinataire,
      status: 'completed'
    });

    // Transaction crédit pour le compte destinataire (si interne)
    if (destinationAccount) {
      await transactionService.createTransaction({
        transactionId: `TXN-${Date.now() + 1}`,
        description: `Virement reçu de ${sourceAccount.accountNumber}`,
        amount: virementData.montant,
        type: 'credit',
        category: 'Virement',
        accountId: destinationAccount._id.toString(),
        userId: destinationAccount.userId.toString(),
        reference: virement.reference,
        beneficiaryName: `Compte ${sourceAccount.accountNumber}`,
        status: 'completed'
      });
    }

    // 9. ENVOI DES EMAILS - ATTENDRE LE RÉSULTAT
await this.sendVirementEmails(sourceAccount, destinationAccount, virement);

    // 10. RETOURNER LA RÉPONSE
    const virementResponse = virement.toObject();
    
    return {
      success: true,
      message: 'Virement effectué avec succès',
      data: {
        ...virementResponse,
        id: virementResponse._id,
        _id: undefined,
        __v: undefined,
        nouveauSolde: sourceAccount.balance
      }
    };
  }

  // GET VIREMENT BY ID
  async getVirementById(virementId: string, compteSource?: string) {
    if (!Types.ObjectId.isValid(virementId)) {
      throw new Error('ID de virement invalide');
    }

    const virement = await Virement.findById(virementId);

    if (!virement) {
      throw new Error('Virement non trouvé');
    }

    // Vérifier l'accès si compteSource est fourni
    if (compteSource && virement.compteSource !== compteSource) {
      throw new Error('Accès non autorisé à ce virement');
    }

    const virementResponse = virement.toObject();
    
    return {
      success: true,
      data: {
        ...virementResponse,
        id: virementResponse._id,
        _id: undefined,
        __v: undefined
      }
    };
  }

  // GET ALL VIREMENTS pour un compte
  async getVirementsByAccount(accountNumber: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    type?: 'interne' | 'externe' | 'permanent';
  }) {
    // Vérifier que le compte existe
    const account = await Account.findOne({ accountNumber });
    if (!account) {
      throw new Error('Compte non trouvé');
    }

    // Construire la requête
    const query: any = {
      $or: [
        { compteSource: accountNumber },
        { compteDestinataire: accountNumber }
      ]
    };

    if (options?.type) {
      query.type = options.type;
    }

    if (options?.startDate || options?.endDate) {
      query.date = {};
      if (options.startDate) query.date.$gte = options.startDate;
      if (options.endDate) query.date.$lte = options.endDate;
    }

    // Exécuter la requête avec pagination
    const virements = await Virement.find(query)
      .sort({ date: -1 })
      .limit(options?.limit || 50)
      .skip(options?.offset || 0);

    const total = await Virement.countDocuments(query);

    // Nettoyer les réponses
    const cleanedVirements = virements.map(v => {
      const vObj = v.toObject();
      return {
        ...vObj,
        id: vObj._id,
        _id: undefined,
        __v: undefined
      };
    });

    return {
      success: true,
      data: {
        virements: cleanedVirements,
        pagination: {
          total,
          limit: options?.limit || 50,
          offset: options?.offset || 0,
          hasMore: total > (options?.offset || 0) + (options?.limit || 50)
        }
      }
    };
  }

  // GET VIREMENTS RÉCENTS
  async getRecentVirements(accountNumber: string, limit: number = 5) {
    return this.getVirementsByAccount(accountNumber, { limit });
  }

  // CANCEL VIREMENT
  async cancelVirement(virementId: string, accountNumber: string) {
    // Trouver le virement
    const virement = await Virement.findOne({
      _id: virementId,
      compteSource: accountNumber,
      statut: 'effectue' // Seulement les virements effectués peuvent être annulés
    });

    if (!virement) {
      throw new Error('Virement non trouvé ou ne peut pas être annulé');
    }

    // Récupérer le compte source
    const sourceAccount = await Account.findOne({ 
      accountNumber: virement.compteSource 
    });

    if (!sourceAccount) {
      throw new Error('Compte source non trouvé');
    }

    // Rembourser le compte source
    sourceAccount.balance += virement.montant;
    await sourceAccount.save();

    // Mettre à jour le statut du virement
    virement.statut = 'echoue';
    await virement.save();

    // Créer une transaction d'annulation
    await transactionService.createTransaction({
      transactionId: `TXN-${Date.now()}`,
      description: `Annulation virement ${virement.reference}`,
      amount: virement.montant,
      type: 'credit',
      category: 'Annulation',
      accountId: sourceAccount._id.toString(),
      userId: sourceAccount.userId.toString(),
      reference: virement.reference,
      beneficiaryName: virement.nomDestinataire,
      status: 'completed'
    });

    const virementResponse = virement.toObject();
    
    return {
      success: true,
      message: 'Virement annulé avec succès',
      data: {
        ...virementResponse,
        id: virementResponse._id,
        _id: undefined,
        __v: undefined,
        nouveauSolde: sourceAccount.balance
      }
    };
  }

  // Méthode privée pour l'envoi d'emails (ne bloque pas le retour)
  private async sendVirementEmails(sourceAccount: any, destinationAccount: any, virement: any) {
    try {
      // Récupérer les utilisateurs
      const user = await User.findById(sourceAccount.userId);
      const userEmetteur = await User.findById(sourceAccount.userId);
      
      if (userEmetteur) {
        const emailData: any = {
          nom: userEmetteur.fullName,
          reference: virement.reference,
          montant: virement.montant,
          destinataire: virement.nomDestinataire,
          date: virement.date,
          type: virement.type,
          compteSource: virement.compteSource
        };
        
        if (virement.motif) emailData.motif = virement.motif;
        
        const result = await emailService.sendVirementConfirmation(userEmetteur.email, emailData);
        console.log(`✅ Email de confirmation envoyé à ${userEmetteur.email}`);

        if (result.success) {
        console.log(`✅ Email de confirmation envoyé à ${userEmetteur.email}`);
        if (result.previewUrl) {
          console.log(`🔗 Aperçu: ${result.previewUrl}`);
        }
      } else {
        console.error(`❌ Échec email confirmation:`, result.error);
      }
    }


      if (destinationAccount) {
        const userDestinataire = await User.findById(destinationAccount.userId);
        if (userDestinataire && userEmetteur) {
          const emailRecuData: any = {
            nom: userDestinataire.fullName,
            expediteur: userEmetteur.fullName,
            montant: virement.montant,
            reference: virement.reference,
            date: virement.date
          };
          
          if (virement.motif) emailRecuData.motif = virement.motif;
          
          await emailService.sendVirementRecu(userDestinataire.email, emailRecuData);
          console.log(`Email de réception envoyé à ${userDestinataire.email}`);
        }
      }
    } catch (error) {
      console.error('Erreur envoi emails:', error);
    }
  }
}

export default new VirementService();