import { ApiBase } from "./api-base";
import { ICancellationToken } from "../reactive";
import { W6Context } from "../w6context";

export interface IServerSession { address: string; state: ServerState; message: string; endtime: Date }

enum Action {
  Start,
  Stop,
  Restart,
  Prepare,
  Scale
}

export class ServersApi extends ApiBase {
  constructor(ctx: W6Context) { super(ctx, "/server-manager/servers"); }

  async createOrUpdate(server) {
    // TODO: Creation/Updating could be a long running op, in such case we should adopt the same Operation model as the actions (start/stop etc)
    const opId = await this._post<string>(`/`, server);
    return await this.get(opId);
  }

  list(gameId: string) { return this._get<{ items: IManagedServerListItem[] }>(`/?gameId=${gameId}`); }
  get(id: string) { return this._get<IManagedServer>(`/${id}`); }
  session(id: string) { return this._get<IServerSession>(`/${id}/session`); }

  start(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Start, undefined, ct); }
  stop(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Stop, undefined, ct); }
  restart(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Restart, undefined, ct); }
  prepare(id: string, ct?: ICancellationToken) { return this.changeState(id, Action.Prepare, undefined, ct); }
  scale(id: string, size: ServerSize, additionalSlots: number, ct?: ICancellationToken) { return this.changeState(id, Action.Scale, { size, additionalSlots }, ct); }

  private async changeState(id: string, action: Action, data?, ct?: ICancellationToken) {
    const operationId = await this._post<string>(`/${id}/${Action[action].toLowerCase()}`, data);
    await this._pollOperationState(id, operationId, ct);
  }
}



export interface IManagedServer {
  id: string;
  location: ServerLocation;
  size: ServerSize;
  secondaries: { size: ServerSize }[];

  additionalSlots: number;

  name: string;
  password: string;
  adminPassword: string;

  settings: IArmaSettings;

  mods: { id: string, constraint?: string }[];
  missions: { id: string }[];
  status: {
    address
    state
    message
    endtime
  }
}

export interface IManagedServerListItem {
  id: string; name: string; gameId: string; userId: string
}

export interface IArmaSettings {
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
