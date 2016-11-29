import { ITabModel, ServerTab } from "../rside-bar";
import { uiCommand2, handlerFor, DbQuery, Command, Query, ServerStore } from "../../../framework";

interface IStatusTab extends ITabModel<any> { }


enum State {
  Initializing,

  PreparingContent,
  PreparingConfiguration,

  Provisioning = 5000,

  Launching = 6000,

  Running = 9998,
  Failed = 9999
}


interface IJobInfo { address: string; state: State; message: string; }

export class Index extends ServerTab<IStatusTab> {
  jobState: IJobInfo;
  State = State;
  timeLeft: number;


  start = uiCommand2("Start", () => this.handleHost(), { cls: "ignore-close" });
  stop = uiCommand2("Stop", async () => { }, { cls: "ignore-close" });
  restart = uiCommand2("Restart", async () => { }, { cls: "ignore-close" });
  prepare = uiCommand2("Prepare content and configs", async () => { }, { cls: "ignore-close" });
  status = "Stopped";
  lock = uiCommand2("Lock", async () => { }, { cls: "ignore-close" });
  unlock = uiCommand2("Unlock", async () => { }, { cls: "ignore-close" });
  players = [
    { name: "Player X" },
    { name: "Player Y" },
  ];

  handleHost = async () => {
    const jobId = await new HostW6Server(this.w6.activeGame.id, ServerStore.serverToStorage(this.server)).handle(this.mediator); //this.model.host(this.model);
    this.jobState = <any>{ state: State.Initializing };
    this.timeLeft = 60 * 60;

    while (this.jobState.state < State.Running) {
      this.jobState = await new GetJobState(jobId).handle(this.mediator);
      await new Promise(res => setTimeout(() => res(), 2000));
    }
    if (this.jobState.state === State.Failed) { throw new Error(`Job failed: ${this.jobState.message}`); }
    const iv = setInterval(() => {
      this.timeLeft -= 1; // todo; use a time calc instead
      if (this.timeLeft === 0) { clearInterval(iv); }
    }, 1000);

    //this.controller.ok();
  }
}

class HostW6Server extends Command<string> {
  constructor(public gameId: string, public serverInfo) { super(); }
}

@handlerFor(HostW6Server)
class HostW6ServerHandler extends DbQuery<HostW6Server, string> {
  handle(request: HostW6Server) {
    return this.context.postCustom<string>("/server-manager/jobs", request);
  }
}

class GetJobState extends Query<IJobInfo> { constructor(public id: string) { super(); } }

@handlerFor(GetJobState)
class GetJobStateHandler extends DbQuery<GetJobState, IJobInfo> {
  handle(request: GetJobState) {
    return this.context.getCustom(`/server-manager/jobs/${request.id}`);
  }
}
