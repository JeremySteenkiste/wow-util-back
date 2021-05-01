export interface IVente {
  date: string;
  heure: string;
  prix: number;
  quantite: number;
}
export interface IItem {
  id: string;
  bonus_lists?: string[];
  ventes: IVente[];
}
export interface IHdv {
  contenu: IItem[];
}
