import { config, Observable, of } from 'rxjs';
import { HttpService, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import firebase from 'firebase';

@Injectable()
export class AppService {
  firebaseConfig = {
    apiKey: 'AIzaSyApXZYK4bcTw391NbPHgzZLI7ug8Ig-2qo',
    authDomain: 'wow-util-db.firebaseapp.com',
    databaseURL:
      'https://wow-util-db-default-rtdb.europe-west1.firebasedatabase.app/',
    storageBucket: 'wow-util-db.appspot.com',
  };
  db: firebase.database.Database;

  constructor(private httpService: HttpService) {
    this.dbInit();
  }

  dbInit() {
    firebase.initializeApp(this.firebaseConfig);
    this.db = firebase.database();
  }

  //ID Hyjal : 542/1390
  urlBnet: string =
    'https://eu.api.blizzard.com/data/wow/connected-realm/1390/auctions';

  //TODO: BACK : Mettre l'appel toutes les heures
  //TODO: BACK : Faire un interval de temps interessant
  //1h : 3600000
  // 1 min :  60000 ms
  //30sec : 30000 ms
  // 1s : 1000 ms

  @Interval(30000)
  recurrentTache() {
    this.getBnetHdv().subscribe((hdvResult: any) => {
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
    return this.httpService.get(this.urlBnet, {
      params: {
        namespace: 'dynamic-eu',
        locale: 'fr_FR',
        access_token: 'USkVg6S1IadjsekF39K2X8blIex8I8taQ2',
      },
    });
  }

  mappingBnetToFirebase(dataBnet: any[]) {
    //TODO: BACK : Faire le mapping sur les données en suivant le model vue avec Nat
    let timeStamp = new Date();
    console.log(dataBnet[0]);
    console.log(
      'Retour Bnet API',
      timeStamp.toLocaleString('fr-FR', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
    let date =
      timeStamp.getDate() +
      '-' +
      (timeStamp.getMonth() + 1) +
      '-' +
      timeStamp.getFullYear();
    let time = timeStamp.toLocaleTimeString();

    console.log(date);
    console.log(time);

    //Purge DB
    //this.db.ref('hdv/').set({});

    //TODO: BACK : Faire l'appel sur firebase pour l'ajout des données formatées
    this.db
      .ref('hdv/' + date + '/' + time)
      .set(dataBnet)
      .then(() => {
        console.log('Ajout dans firebase');
      })
      .catch((error) => {
        console.log('Erreur lors de lajout dans firebase', error);
      });
  }
}
