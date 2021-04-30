import { config, Observable, of } from 'rxjs';
import { HttpService, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class AppService {
  constructor(private httpService: HttpService) {}

  //ID Hyjal : 542/1390
  urlBnet: string =
    'https://eu.api.blizzard.com/data/wow/connected-realm/1390/auctions';

  //TODO: Mettre l'appel toutes les heures
  //1h : 3600000
  // 1 min :  60000 ms
  //30sec : 30000 ms
  // 1s : 1000 ms

  @Interval(10000)
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
  }
}
