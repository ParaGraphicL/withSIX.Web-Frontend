import { ApiBase } from "./api-base";
import { ICancellationToken } from "../reactive";
import { W6Context } from "../w6context";
import { CollectionScope } from "withsix-sync-api";
import { inject } from "aurelia-framework";

enum Action {
  Start,
  Stop,
  Restart,
  Prepare,
  Scale
}

@inject(W6Context)
export class ServersApi extends ApiBase {
  constructor(ctx: W6Context) { super(ctx, "/server-manager/servers"); }

  async createOrUpdate(server) {
    // TODO: Creation/Updating could be a long running op, in such case we should adopt the same Operation model as the actions (start/stop etc)
    const id = await this._post<string>(`/`, server);
    return await this.get(id);
  }

  list(gameId: string) { return this._get<{ items: IManagedServerListItem[] }>(`/?gameId=${gameId}`); }
  get(id: string) { return this._get<IManagedServer>(`/${id}`); }
  session(id: string) { return this._get<IManagedServerStatus>(`/${id}/session`); }

  getAvailableServers(location: ServerLocation) { return this._get<{ count: number }>(`/locations/${location}`); }

  start(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Start, undefined, ct); }
  stop(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Stop, undefined, ct); }
  restart(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Restart, undefined, ct); }
  prepare(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Prepare, undefined, ct); }
  scale(id: string, size: ServerSize, additionalSlots: number, ct?: ICancellationToken) {
    return this.changeState(id, Action.Scale, { size, additionalSlots }, ct);
  }

  private async changeState(id: string, action: Action, data?, ct?: ICancellationToken) {
    const operationId = await this._post<string>(`/${id}/${Action[action].toLowerCase()}`, data);
    await this._pollOperationState(id, operationId, ct);
  }
}

@inject(W6Context)
export class ServerSignupApi extends ApiBase {
  constructor(ctx: W6Context) { super(ctx, "/api/server-hosting"); }

  signup(model) { return this._post<void>("/", { model }); }
}

export interface IManagedServerSetupBase {
  additionalSlots: number;
  location: ServerLocation;
  size: ServerSize;
  secondaries: Array<{ size: ServerSize; }>;
  settings: IArmaSettings;
}

export interface IManagedServerSetup extends IManagedServerSetupBase {
  mods: Array<{ id: string; constraint?: string; }>;
  missions: Array<{ id: string }>;
}

export interface IManagedServerStatus {
  address: string;
  state: ServerState;
  message: string;
  endtime: string;
}

export interface IManagedServer {
  id: string;
  slug: string;
  description: string;
  scope: CollectionScope;
  name: string;
  setup: IManagedServerSetup;
  status: IManagedServerStatus;
  //gameId: string;
  //userId: string;
}

export interface IManagedServerListItem {
  id: string; name: string; gameId: string; userId: string;
}

export interface IArmaSettings {
  password: string;
  adminPassword: string;
  battlEye: boolean; verifySignatures: boolean; vonQuality: number;
  persistent: boolean; disableVon: boolean; drawingInMap: boolean; forceRotorLibSimulation: boolean; enableDefaultSecurity: boolean; allowedFilePatching: boolean;
}


export enum ServerState {
  Initializing,

  PreparingContent,
  ContentPrepared,

  Provisioning = 5000,
  Provisioned,

  PreparingLaunch,

  LaunchingGame = 6000,

  GameIsRunning = 7000,

  StoppingInstances,

  Failed = 9999,
  InstancesShutdown = 50000

  //End
}

export enum ServerAction {
  Start,
  Stop,
  Prepare,
  Restart // Incl Config+Content preparation
}

export enum ServerSize {
  VerySmall = -2,
  Small = -1,
  Normal = 0,
  Large
}

export enum ServerLocation {
  WestEU,
  WestUS
}
