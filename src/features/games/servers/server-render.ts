import {
  DbClientQuery, GameHelper, IIPEndpoint, IServerInfo, LaunchAction, LaunchGame,
  Query, ViewModel, handlerFor, uiCommand2
} from "../../../framework";

import { ServerRenderBase } from './server-render-base';

export class ServerRender extends ServerRenderBase {
  activate(model) { return this.activateInternal(model); }
}

