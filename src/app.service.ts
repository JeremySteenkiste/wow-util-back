import { catchError, timestamp } from 'rxjs/operators';
import { BNET_CONFIG, FIREBASE_CONFIG, BNET_URL } from './constantes';
import { IHdv, IItem } from './models/hdv.model';
import { Observable, of } from 'rxjs';
import { HttpService, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import firebase from 'firebase';

var moment = require('moment');

@Injectable()
export class AppService {
  db: firebase.database.Database;
  token_Bnet: string;

  constructor(private httpService: HttpService) {
    this.dbInit();
    this.getTokenBnet();

    // this.purgeFirebase();
  }

  purgeFirebase() {
    // Si la db est trop grosse
    // firebase database:remove /hdv/ --project wow-util-db
    console.log('Purge de la db', moment().format('DD/MM/YYYY - HH:mm:ss'));
    this.db.ref('/hdv/').remove();
  }

  dbInit() {
    firebase.initializeApp(FIREBASE_CONFIG);
    this.db = firebase.database();
  }

  createAccessToken(apiKey, apiSecret, region = 'eu') {
    return new Promise((resolve, reject) => {
      let credentials = Buffer.from(`${apiKey}:${apiSecret}`);

      const requestOptions = {
        host: `${region}.battle.net`,
        path: '/oauth/token',
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials.toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };

      let responseData = '';

      function requestHandler(res) {
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          let data = JSON.parse(responseData);
          resolve(data);
        });
      }
      let request = require('https').request(requestOptions, requestHandler);
      request.write('grant_type=client_credentials');
      request.end();

      request.on('error', (error) => {
        reject(error);
      });
    });
  }

  getTokenBnet() {
    return this.createAccessToken(
      BNET_CONFIG.client_id,
      BNET_CONFIG.client_secret,
      'eu',
    ).then((result: any) => {
      this.token_Bnet = result.access_token;
      this.recurrentTache();
    });
  }

  //TODO: BACK : Faire un interval de temps interessant
  //1h : 3600000
  // 1 min :  60000 ms
  //30sec : 30000 ms
  // 1s : 1000 ms

  @Interval(3600000)
  recurrentTache() {
    this.getBnetHdv().subscribe((hdvResult: any) => {
      console.log('Retour BNET API', moment().format('DD/MM/YYYY - HH:mm:ss'));
      this.mappingBnetToFirebase(hdvResult.data.auctions);
    });
  }

  getBnetHdv(): Observable<any> {
    let timeStamp = new Date();
    console.log('Appel Bnet API', moment().format('DD/MM/YYYY - HH:mm:ss'));

    return this.httpService
      .get(BNET_URL, {
        params: {
          namespace: BNET_CONFIG.namespace,
          locale: BNET_CONFIG.locale,
          access_token: this.token_Bnet,
        },
      })
      .pipe(
        catchError((error) => {
          console.log(error.response.status);
          if (error.response.status === 401) {
            console.log('Error sur le token BNET');
            this.getTokenBnet();
          }
          return of([]);
        }),
      );
  }

  mappingBnetToFirebase(dataBnet: any[]) {
    console.log('Mapping Données', moment().format('DD/MM/YYYY - HH:mm:ss'));

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

    this.putDateToFirebase(dataToFirebase);
  }

  putDateToFirebase(dataToFirebase: IHdv) {
    console.log(
      'Début Chargement Firebase',
      moment().format('DD/MM/YYYY - HH:mm:ss'),
    );

    dataToFirebase.contenu.forEach((item: IItem) => {
      let index;
      this.db
        .ref(
          'hdv/' +
            item.id +
            '/' +
            moment().format('DD-MM-YYYY') +
            '/' +
            moment().tz('Europe/Paris').format('HH:mm') +
            '/ventes',
        )
        .set(item.ventes)
        .then(() => {})
        .catch((error) => {
          console.log('Erreur lors de lajout dans firebase' + item.id, error);
        });
    });

    console.log(
      'Fin Chargement Firebase',
      moment().format('DD/MM/YYYY - HH:mm:ss'),
    );
  }
}
