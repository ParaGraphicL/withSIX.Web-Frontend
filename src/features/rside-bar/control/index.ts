import { ITabModel, ServerTab } from "../rside-bar";
import { uiCommand2, handlerFor, DbQuery, Command, Query, ServerStore, VoidCommand, ServerState, ServerAction, RequestBase, ServerClient, IServerSession } from "../../../framework";
import { inject } from "aurelia-framework";

interface IStatusTab extends ITabModel<any> { }

//enum JobAction {
//  Cancel
//}


export class Index extends ServerTab<IStatusTab> {
    get jobState() { return this.server.state; }
    isLocked = false;
    State = ServerState;

    get isRunning() { return this.jobState && this.jobState.state === ServerState.GameIsRunning; }
    get hasActiveJob() { return !!this.server.currentJobId; }

    get canStart() {
        return this.jobState && (this.jobState.state === ServerState.Initializing || this.jobState.state >= ServerState.Failed);
    }
    get canPrepare() {
        return this.jobState && (this.jobState.state === ServerState.Initializing
            || this.jobState.state === ServerState.GameIsRunning || this.jobState.state >= ServerState.Failed);
    }

    start = uiCommand2("Start", () => this.handleStart(), {
        canExecuteObservable: this.observeEx(x => x.canStart),
        cls: "ignore-close default",
    });
    // TODO: Stop as a Cancel of Start
    stop = uiCommand2("Stop", () => this.handleStop(), {
        canExecuteObservable: this.observeEx(x => x.isRunning),
        cls: "ignore-close danger",
    });
    restart = uiCommand2("Restart", () => this.handleRestart(), {
        canExecuteObservable: this.observeEx(x => x.isRunning),
        cls: "ignore-close warn",
    });
    prepare = uiCommand2("Prepare content and configs",
        () => this.handlePrepare(), {
            canExecuteObservable: this.observeEx(x => x.canPrepare),
            cls: "ignore-close warn",
        });

    lock = uiCommand2("Lock", async () => alert("TODO"), {
        cls: "ignore-close warn",
        isVisibleObservable: this.observeEx(x => x.isRunning).combineLatest(this.observeEx(x => x.isLocked), (r, l) => r && !l),
    });
    unlock = uiCommand2("Unlock", async () => alert("TODO"), {
        cls: "ignore-close warn",
        isVisibleObservable: this.observeEx(x => x.isRunning).combineLatest(this.observeEx(x => x.isLocked), (r, l) => r && l),
    });

    players = [
        { name: "Player X" },
        { name: "Player Y" },
    ];

    handleStart = async () => {
        await this.saveChanges();
        await new StartServer(this.server.id).handle(this.mediator);
    }
    handleRestart = async () => {
        await this.saveChanges();
        await new RestartServer(this.server.id).handle(this.mediator);
    }
    handlePrepare = async () => {
        await this.saveChanges();
        await new PrepareServer(this.server.id).handle(this.mediator)
    }
    handleStop = () => new StopServer(this.server.id).handle(this.mediator);

    async saveChanges() {
        this.server.currentJobId = await new CreateOrUpdateServer(this.w6.activeGame.id, this.server.id, ServerStore.serverToStorage(this.server)).handle(this.mediator);
    }
}

@inject(ServerClient)
abstract class ServerHandler<TRequest, TResponse> extends RequestBase<TRequest, TResponse> {
    constructor(protected client: ServerClient) { super(); }
}

class CreateOrUpdateServer extends Command<string> {
    constructor(public gameId: string, public id: string, public serverInfo) { super(); }
}

@handlerFor(CreateOrUpdateServer)
class CreateOrUpdateServerHandler extends ServerHandler<CreateOrUpdateServer, string> {
    handle(request: CreateOrUpdateServer) {
        return this.client.servers.createOrUpdate(request);
    }
}


class GetServerState extends Query<IServerSession> { constructor(public id: string) { super(); } }

@handlerFor(GetServerState)
class GetServerStateHandler extends ServerHandler<GetServerState, IServerSession> {
    handle(request: GetServerState) { return this.client.servers.get(request.id); }
}

class StartServer extends VoidCommand { constructor(public id: string) { super(); } }
@handlerFor(StartServer)
class StartServerStateHandler extends ServerHandler<StartServer, string> {
    handle(request: StartServer) { return this.client.servers.start(request.id); }
}

class StopServer extends VoidCommand { constructor(public id: string) { super(); } }
@handlerFor(StopServer)
class StopServerStateHandler extends ServerHandler<StopServer, string> {
    handle(request: StopServer) { return this.client.servers.stop(request.id); }
}

class RestartServer extends VoidCommand { constructor(public id: string) { super(); } }
@handlerFor(RestartServer)
class RestartServerStateHandler extends ServerHandler<RestartServer, string> {
    handle(request: RestartServer) { return this.client.servers.restart(request.id); }
}

class PrepareServer extends VoidCommand { constructor(public id: string) { super(); } }
@handlerFor(PrepareServer)
class PrepareServerStateHandler extends ServerHandler<PrepareServer, string> {
    handle(request: PrepareServer) { return this.client.servers.prepare(request.id); }
}

class GetJobState extends Query<IServerSession> { constructor(public id: string) { super(); } }

@handlerFor(GetJobState)
class GetJobStateHandler extends ServerHandler<GetJobState, IServerSession> {
    handle(request: GetJobState) { return this.client.servers.session(request.id); }
}

/*
class CancelJob extends VoidCommand { constructor(public id: string) { super(); } }

@handlerFor(CancelJob)
class CancelJobHandler extends ServerHandler<CancelJob, IServerSession> {
    handle(request: CancelJob) { return this.client.jobs.delete(request.id); }
}
*/
