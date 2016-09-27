import {
  DbClientQuery, GameHelper, IIPEndpoint, IServerInfo, LaunchAction, LaunchGame,
  Query, ViewModel, handlerFor, uiCommand2
} from "../../../framework";

import { ServerRenderBase } from './server-render-base';

export class Show extends ServerRenderBase {
  activate(params, routeConfig) {
    return super.activateInternal(params.serverId.replace(/-/g, "."));
  }
}
