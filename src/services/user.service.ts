import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';
import { Account } from '../models/Account.model';
import { IUser } from '../interfaces/IUser';
import { Types } from 'mongoose';

export class UserService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'monSuperCodeSecretAxel123456@';
  private readonly SALT_ROUNDS = 10;

  // Générer un numéro de compte unique
  private async generateAccountNumber(): Promise<string> {
    const prefix = 'M';
    const timestamp = Date.now().toString().slice(-7); // Prendre les 7 derniers chiffres du timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(2, '0');
    const accountNumber = `${timestamp}${prefix}${random}`;
    
    const existing = await Account.findOne({ accountNumber });
    if (existing) {
      return this.generateAccountNumber();
    }
    return accountNumber;
  }

 // Générer un IBAN unique
private async generateIBAN(): Promise<string> {
  const countryCode = 'FR';
  const checksum = '76'; // Clé de contrôle (généralement 76 pour la France)
  const bankCode = '30004'; // Code banque BNP Paribas
  const branchCode = '02837'; // Code guichet
  const accountNumber = Math.floor(Math.random() * 1000000000000).toString().padStart(11, '0'); // 11 chiffres
  const nationalChecksum = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 chiffres
  
  // Format IBAN français: FR + 2 chiffres clé + 5 chiffres code banque + 5 chiffres code guichet + 11 chiffres compte + 2 chiffres clé
  // Exemple: FR76 30004 02837 12345678901 23
  const ibanWithoutSpaces = `${countryCode}${checksum}${bankCode}${branchCode}${accountNumber}${nationalChecksum}`;
  
  // Formatage avec espaces tous les 4 caractères pour la lisibilité
  const formattedIBAN = ibanWithoutSpaces.match(/.{1,4}/g)?.join(' ') || ibanWithoutSpaces;
  
  const existing = await Account.findOne({ iban: formattedIBAN });
  if (existing) {
    return this.generateIBAN();
  }
  return formattedIBAN;
}

  // REGISTER
  async register(userData: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    cin: string;
    address: string;
  }) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { phone: userData.phone },
        { cin: userData.cin }
      ]
    });

    if (existingUser) {
      if (existingUser.email === userData.email) {
        throw new Error('Cet email est déjà utilisé');
      }
      if (existingUser.phone === userData.phone) {
        throw new Error('Ce numéro de téléphone est déjà utilisé');
      }
      if (existingUser.cin === userData.cin) {
        throw new Error('Ce CIN est déjà utilisé');
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

    // Créer l'utilisateur
    const user = new User({
      ...userData,
      password: hashedPassword,
      lastLogin: null
    });

    await user.save();

    // Créer un compte courant par défaut
    const accountNumber = await this.generateAccountNumber();
    const iban = await this.generateIBAN();

    const account = new Account({
      userId: user._id,
      accountNumber,
      accountType: 'Current',
      balance: 0,
      currency: 'EUR',
      iban,
      openingDate: new Date().toISOString().split('T')[0],
      status: 'suspended',
      overdraftLimit: 0,
      Operations: []
    });

    await account.save();

    // Lier le compte à l'utilisateur
    user.compte = account._id;
    await user.save();

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        fullName: user.fullName 
      },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Ne pas renvoyer le mot de passe
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      success: true,
      message: 'Inscription réussie',
      data: {
        user: userResponse,
        account: {
          id: account._id,
          accountNumber: account.accountNumber,
          iban: account.iban,
          type: account.accountType,
          status: account.status
        },
        token
      }
    };
  }

  // LOGIN
  async login(accountNumber: string, password: string) {
    // Trouver l'utilisateur avec son mot de passe
    const account = await Account.findOne({ accountNumber });
     
    if (!account) {
      throw new Error('Numéro de compte ou mot de passe incorrect');
    }

    const user = await User.findById(account.userId).select('+password');
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    
    if (!isPasswordValid) {
      throw new Error('Numéro de compte ou mot de passe incorrect');
    }

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Récupérer les comptes de l'utilisateur
    const accounts = await Account.find({ userId: user._id });

    // Générer le token
    const token = jwt.sign(
      { 
        userId: user._id,
        cin: user.cin,
        fullName: user.fullName,
        email: user.email,
        account: accounts,
        loans: user.prets
      },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Préparer la réponse
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userResponse,
        accounts: accounts.map(acc => ({
          id: acc._id,
          accountNumber: acc.accountNumber,
          iban: acc.iban,
          type: acc.accountType,
          balance: acc.balance,
          currency: acc.currency,
          status: acc.status
        })),
        token
      }
    };
  }

  // GET USER BY ID
  async getUserById(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('ID utilisateur invalide');
    }

    const user = await User.findById(userId)
      .populate('compte');

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const accounts = await Account.find({ userId: user._id })
      .populate('Operations');
      //.populate('CardOfUser');

    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      success: true,
      data: {
        user: userResponse,
        accounts: accounts.map(acc => ({
          ...acc.toObject(),
          id: acc._id,
          _id: undefined,
          __v: undefined
        }))
      }
    };
  }

  // services/user.service.ts - Ajoute cette méthode

// GET PROFILE (pour le refresh)
async getProfile(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('ID utilisateur invalide');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  const accounts = await Account.find({ userId: user._id });
  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    success: true,
    data: {
      user: userResponse,
      accounts: accounts.map(acc => ({
        id: acc._id,
        accountNumber: acc.accountNumber,
        iban: acc.iban,
        type: acc.accountType,
        balance: acc.balance,
        currency: acc.currency,
        status: acc.status
      }))
    }
  };
}

  // UPDATE USER
  async updateUser(userId: string, updateData: Partial<IUser> ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('ID utilisateur invalide');
    }

    // Vérifier si l'email ou téléphone existe déjà
    if (updateData.email || updateData.phone) {
      const query: any = {
        _id: { $ne: userId },
        $or: []
      };

      if (updateData.email) {
        query.$or.push({ email: updateData.email });
      }

      if (updateData.phone) {
      query.$or.push({ phone: updateData.phone });
      }

      const existingUser = await User.findOne(query);

      if (existingUser) {
        if (updateData.email && existingUser.email === updateData.email) {
          throw new Error('Cet email est déjà utilisé');
        }

        if (updateData.phone && existingUser.phone === updateData.phone) {
          throw new Error('Ce numéro de téléphone est déjà utilisé');
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {$set: updateData},
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: userResponse
    };
  }

}
