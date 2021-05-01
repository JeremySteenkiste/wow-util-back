import { catchError } from 'rxjs/operators';
import { BNET_CONFIG, FIREBASE_CONFIG, BNET_URL } from './constantes';
import { IHdv } from './models/hdv.model';
import { Observable, of } from 'rxjs';
import { HttpService, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import firebase from 'firebase';

@Injectable()
export class AppService {
  db: firebase.database.Database;

  constructor(private httpService: HttpService) {
    this.dbInit();
    this.recurrentTache();
  }

  dbInit() {
    firebase.initializeApp(FIREBASE_CONFIG);
    this.db = firebase.database();
  }

  //TODO: BACK : Faire un interval de temps interessant
  //1h : 3600000
  // 1 min :  60000 ms
  //30sec : 30000 ms
  // 1s : 1000 ms

  @Interval(3600000)
  recurrentTache() {
    this.getBnetHdv().subscribe((hdvResult: any) => {
      console.log(
        'Retour BNET API',
        new Date().toLocaleString('fr-FR', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
      this.mappingBnetToFirebase(hdvResult.data.auctions);
    });
  }

  getBnetHdv(): Observable<any> {
    let timeStamp = new Date();
    console.log(
      'Appel Bnet API',
      timeStamp.toLocaleString('fr-FR', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );

    let url =
      'https://eu.api.blizzard.com/data/wow/connected-realm/1390/auctions';
    return this.httpService
      .get(url, {
        params: {
          namespace: 'dynamic-eu',
          locale: 'fr_FR',
          access_token: 'USkVg6S1IadjsekF39K2X8blIex8I8taQ2',
        },
      })
      .pipe(
        catchError((error) => {
          console.log(error);
          return of([]);
        }),
      );
  }

  mappingBnetToFirebase(dataBnet: any[]) {
    console.log(
      'Mapping Données',
      new Date().toLocaleString('fr-FR', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
    //TODO: BACK : Faire le mapping sur les données en suivant le model vue avec Nat
    let timeStamp = new Date();

    let date =
      timeStamp.getDate().toString().padStart(2, '0') +
      '-' +
      (timeStamp.getMonth() + 1).toString().padStart(2, '0') +
      '-' +
      timeStamp.getFullYear();

    let dataToFirebase: IHdv = {
      contenu: [],
    };

    //Parcours l'ensemble des données bnet pour les formater
    dataBnet.forEach((action: any) => {
      let itemExistant = dataToFirebase.contenu.find((item) => {
        return item.id === action.item.id;
      });
      //Si l'item existe déjà dans le tableau on ajout toutes les ventes à l'item
      if (itemExistant) {
        dataToFirebase.contenu[
          dataToFirebase.contenu.indexOf(itemExistant)
        ].ventes.push({
          date: date,
          heure: timeStamp.toLocaleTimeString(),
          //Si pas de prix d'achat immediat
          prix: action.buyout ? action.buyout : -1,
          //Si prix à l'unité présent
          prix_unite: action.unit_price ? action.unit_price : -1,
          quantite: action.quantity,
        });

        //Sinon on ajoute l'item au tableau
      } else {
        dataToFirebase.contenu.push({
          id: action.item.id,
          //TODO: Check les bonus liste
          ventes: [
            {
              date: date,
              heure: timeStamp.toLocaleTimeString(),
              //Si pas de prix d'achat immediat
              prix: action.buyout ? action.buyout : -1,
              //Si prix à l'unité présent
              prix_unite: action.unit_price ? action.unit_price : -1,
              quantite: action.quantity,
            },
          ],
        });
      }
    });

    //Purge DB
    // this.db.ref('hdv/').set({});
    this.putDateToFirebase(dataToFirebase);
  }

  putDateToFirebase(dataToFirebase: IHdv) {
    console.log(
      'Set Firebase',
      new Date().toLocaleString('fr-FR', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );

    //TODO: BACK : Faire l'appel sur firebase pour l'ajout des données formatées
    this.db
      .ref('hdv/')
      .set(dataToFirebase)
      .then(() => {
        console.log(
          'Set Firebase Done',
          new Date().toLocaleString('fr-FR', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        );
      })
      .catch((error) => {
        console.log('Erreur lors de lajout dans firebase', error);
      });
  }
}
