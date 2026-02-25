export interface IVirement extends Document {
  id: string;
  reference: string;
  date: string;
  montant: number;
  type: 'interne' | 'externe' | 'permanent';
  statut: 'en_attente' | 'effectue' | 'echoue';
  
  // Comptes
  compteSource: string;      // accountNumber du compte émetteur
  compteDestinataire: string; // accountNumber ou RIB du destinataire
  
  // Infos destinataire
  nomDestinataire: string;
  banqueDestinataire?: string; // Pour les virements externes
  
  motif?: string;
}

export interface Beneficiaire extends Document {
  id: string;
  userId: string;
  nom: string;
  compte: string;            // accountNumber ou RIB
  banque?: string;           // Pour les bénéficiaires externes
  favori: boolean;
}

export interface VirementPermanent extends Document {
  id: string;
  reference: string;
  montant: number;
  compteSource: string;
  compteDestinataire: string;
  nomDestinataire: string;
  periodicite: 'mensuel' | 'trimestriel' | 'annuel';
  dateDebut: string;
  dateFin?: string;
  prochaineDate: string;
  actif: boolean;
}