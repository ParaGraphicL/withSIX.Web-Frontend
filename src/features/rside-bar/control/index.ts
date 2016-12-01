import { ITabModel, ServerTab } from "../rside-bar";
import { uiCommand2, handlerFor, DbQuery, Command, Query, ServerStore, VoidCommand } from "../../../framework";

interface IStatusTab extends ITabModel<any> { }

enum State {
  Initializing,

  PreparingContent,
  PreparingConfiguration,

  Provisioning = 5000,
  InstancesRunning,
  PreparingLaunch,

  LaunchingGame = 6000,

  GameIsRunning = 7000,

  Cancelling = 8000,

  StoppingInstances,
  GameExited,

  Failed = 9999,
  Cancelled = 10000,
  InstancesShutdown = 50000

  //End
}

enum ServerAction {
  Start,
  Stop,
  Prepare,
  Restart // Incl Config+Content preparation
}

//enum JobAction {
//  Cancel
//}


interface IJobInfo { address: string; state: State; message: string; endtime: Date }

export class Index extends ServerTab<IStatusTab> {
  jobState: IJobInfo;
  State = State;

  get isRunning() { return this.jobState && this.jobState.state === State.GameIsRunning; }
  get hasActiveJob() { return !!this.server.currentJobId; }

  start = uiCommand2("Start", () => this.handleHost(), {
    isVisibleObservable: this.observeEx(x => x.isRunning).map(x => !x),
    cls: "ignore-close",
  });
  stop = uiCommand2("Stop", () => this.handleStop(), {
    isVisibleObservable: this.observeEx(x => x.isRunning),
    cls: "ignore-close",
  });
  cancel = uiCommand2("Cancel", () => this.cancelJob(), {
    cls: "ignore-close",
    //isVisibleObservable: this.observeEx(x => x.hasActiveJob),
  });
  restart = uiCommand2("Restart", () => this.handleRestart(), {
    isVisibleObservable: this.observeEx(x => x.isRunning),
    cls: "ignore-close",
  });
  prepare = uiCommand2("Prepare content and configs",
    () => new ChangeServerState(this.server.id, ServerAction.Stop).handle(this.mediator), {
      canExecuteObservable: this.observeEx(x => x.jobState).map(x => !x || (x.state === State.GameIsRunning)),
      cls: "ignore-close",
    });

  lock = uiCommand2("Lock", async () => alert("TODO"), {
    cls: "ignore-close", isVisibleObservable: this.observeEx(x => x.isRunning),
  });
  unlock = uiCommand2("Unlock", async () => alert("TODO"), {
    cls: "ignore-close", isVisibleObservable: this.observeEx(x => x.isRunning),
  });

  players = [
    { name: "Player X" },
    { name: "Player Y" },
  ];

  cancelJob = async () => {
    await new CancelJob(this.server.currentJobId).handle(this.mediator);
    while (this.jobState.state < State.Failed) {
      await new Promise(res => setTimeout(() => res(), 2000));
    }
  }

  handleStop = async () => {
    await new ChangeServerState(this.server.id, ServerAction.Stop).handle(this.mediator);
    while (this.jobState.state < State.Failed) {
      await new Promise(res => setTimeout(() => res(), 2000));
    }
  }

  handleHost = async () => {
    // TODO: this should be: SaveServerChanges + ServerAction.Start
    const jobId = this.server.currentJobId =
      await new HostW6Server(this.w6.activeGame.id, this.server.id, ServerStore.serverToStorage(this.server)).handle(this.mediator);
    this.jobState = <any>{ state: State.Initializing };


    setTimeout(async () => {
      while (this.jobState.state < State.Failed) {
        this.jobState = await new GetJobState(jobId).handle(this.mediator);
        await new Promise(res => setTimeout(() => res(), 2000));
      }
      this.jobState = null;
    }, 0);

    while (this.jobState.state < State.GameIsRunning) {
      await new Promise(res => setTimeout(() => res(), 2000));
    }
    if (this.jobState.state === State.Failed) { throw new Error(`Job failed: ${this.jobState.message}`); }
    this.server.currentJobId = null;
  }

  handleRestart = async () => {
    const jobId = this.server.currentJobId = await new ChangeServerState(this.server.id, ServerAction.Restart).handle(this.mediator);
    while (this.jobState.state >= State.GameIsRunning) {
      await new Promise(res => setTimeout(() => res(), 2000));
    }
    while (this.jobState.state < State.GameIsRunning) {
      await new Promise(res => setTimeout(() => res(), 2000));
    }
  }
}

class HostW6Server extends Command<string> {
  constructor(public gameId: string, public id: string, public serverInfo) { super(); }
}

@handlerFor(HostW6Server)
class HostW6ServerHandler extends DbQuery<HostW6Server, string> {
  handle(request: HostW6Server) {
    return this.context.postCustom<string>("/server-manager/jobs", request);
  }
}


class GetServerState extends Query<IJobInfo> { constructor(public id: string) { super(); } }

@handlerFor(GetServerState)
class GetServerStateHandler extends DbQuery<GetServerState, IJobInfo> {
  handle(request: GetServerState) {
    return this.context.getCustom(`/server-manager/servers/${request.id}`);
  }
}

class ChangeServerState extends Query<string> { constructor(public id: string, public action: ServerAction) { super(); } }

@handlerFor(ChangeServerState)
class ChangeServerStateHandler extends DbQuery<ChangeServerState, IJobInfo> {
  handle(request: ChangeServerState) {
    return this.context.postCustom(`/server-manager/servers/${request.id}`, { action: request.action });
  }
}



class GetJobState extends Query<IJobInfo> { constructor(public id: string) { super(); } }

@handlerFor(GetJobState)
class GetJobStateHandler extends DbQuery<GetJobState, IJobInfo> {
  handle(request: GetJobState) {
    return this.context.getCustom(`/server-manager/jobs/${request.id}`);
  }
}

class CancelJob extends VoidCommand { constructor(public id: string) { super(); } }

@handlerFor(CancelJob)
class CancelJobHandler extends DbQuery<CancelJob, IJobInfo> {
  handle(request: CancelJob) {
    return this.context.deleteCustom(`/server-manager/jobs/${request.id}`);
  }
}
