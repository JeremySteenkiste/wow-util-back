export interface IVente {
  prix: number;
  prix_unite: number;
  quantite: number;
}
export interface IItem {
  id: number;
  bonus_lists?: string[];
  ventes: IVente[];
}
export interface IHdv {
  contenu: IItem[];
}
