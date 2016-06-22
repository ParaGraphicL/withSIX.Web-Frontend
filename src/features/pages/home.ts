import {inject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-http-client';
import {Mediator, Query, DbQuery, handlerFor} from '../../framework';
import {MainBase} from './index';

interface IHomeData {
  totalDownloads: number;
  totalDownloadsMini: number;
  totalAccounts: number;
  totalCollections: number;
  totalMods: number;
  totalMissions: number;
  totalServers: number;
  totalSubscribers: number;
  totalFollowers: number;
  totalLikes: number;
  latestPost?: {};
}

export class Home extends MainBase {
  post = {};
  data: IHomeData;

  constructor(ui) {
    super(ui);
  }

  get totalDownloads() { return this.toAprox(this.data.totalDownloads + this.data.totalDownloadsMini); };
  get totalAccounts() { return this.toAprox(this.data.totalAccounts); };
  get totalCollections() { return this.toAprox(this.data.totalCollections); };
  get totalMods() { return this.toAprox(this.data.totalMods); };
  get totalMissions() { return this.toAprox(this.data.totalMissions); };
  get totalServers() { return this.toAprox(this.data.totalServers); };
  get totalSubscribers() { return this.toAprox(this.data.totalSubscribers); };
  get totalFollowers() { return this.toAprox(this.data.totalFollowers); };
  get totalLikes() { return this.toAprox(this.data.totalLikes); };

  toAprox(count) {
    return count; // todo
  }

  async activate(params, routeConfig) {
    /*      this.userService.getUser(params.id)
      .then(user => {
          routeConfig.navModel.setTitle(user.name);
      });*/
    this.data = {
      totalDownloads: 1,
      totalDownloadsMini: 1,
      totalAccounts: 2,
      totalCollections: 3,
      totalMods: 4,
      totalMissions: 5,
      totalServers: 6,
      totalSubscribers: 7,
      totalFollowers: 8,
      totalLikes: 9
    }
  }
}

class GetHome extends Query<IHomeData> { }

@handlerFor(GetHome)
class GetHomeHandler extends DbQuery<GetHome, IHomeData> {
  public handle(request: GetHome): Promise<IHomeData> {
    return this.context.getCustom("pages/home");
  }
}
