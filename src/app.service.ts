import { BNET_CONFIG, FIREBASE_CONFIG } from './constantes';
import { BNET_URL } from './../../wow-util-app/src/app/constantes/constantes';
import { IHdv } from './models/hdv.model';
import { Observable } from 'rxjs';
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

  //TODO: BACK : Mettre l'appel toutes les heures
  //TODO: BACK : Faire un interval de temps interessant
  //1h : 3600000
  // 1 min :  60000 ms
  //30sec : 30000 ms
  // 1s : 1000 ms

  // @Interval(30000)
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
    return this.httpService.get(BNET_URL, {
      params: BNET_CONFIG,
    });
  }

  mappingBnetToFirebase(dataBnet: any[]) {
    //TODO: BACK : Faire le mapping sur les données en suivant le model vue avec Nat
    let timeStamp = new Date();

    // console.log('Mapping', dataBnet[0]);

    let date =
      timeStamp.getDate() +
      '-' +
      (timeStamp.getMonth() + 1) +
      '-' +
      timeStamp.getFullYear();
    let time = timeStamp.toLocaleTimeString();

    // console.log(date);
    // console.log(time);

    let dataToFirebase: IHdv = {
      contenu: [
        {
          id: '1234',
          ventes: [
            {
              date: 'today',
              heure: 'today',
              prix: 5612,
              quantite: 5612,
            },
          ],
        },
      ],
    };

    let test = dataToFirebase.contenu.find((item) => {
      item.id === '1234';
    });

    console.log('TEST', test);

    // dataBnet.forEach((action: any)=>{
    //   dataToFirebase.contenu.push(
    //     {
    //       id: action.item.id,
    //       bonus_lists: action.item.bonus_lists,
    //       ventes
    //     }
    //   )
    // })

    //Purge DB
    //this.db.ref('hdv/').set({});
  }

  putDateToFirebase(dataBnet: IHdv) {
    //TODO: BACK : Faire l'appel sur firebase pour l'ajout des données formatées
    // this.db
    //   .ref('hdv/' + date + '/' + time)
    //   .set(dataBnet)
    //   .then(() => {
    //     console.log('Ajout dans firebase');
    //   })
    //   .catch((error) => {
    //     console.log('Erreur lors de lajout dans firebase', error);
    //   });
  }
}
