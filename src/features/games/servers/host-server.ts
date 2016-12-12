import {
  CollectionScope, Command, DbClientQuery, DbQuery, Dialog, IReactiveCommand, Query, ServerHelper, VoidCommand, handlerFor, uiCommand2,
} from "../../../framework";


interface IModel {
  scope: CollectionScope;
  name: string;
  password: string;
  description: string;
  commsUrl: string;
  homepageUrl: string;
  files: FileList;
  launchAsDedicated: boolean;
  launch: Function;
  //host: (details) => Promise<void>;
  launchDedicated: Function;
}


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


export class HostServer extends Dialog<IModel> {
  ServerScope = CollectionScope;
  scopes = ServerHelper.scopes;
  scopeHints = ServerHelper.scopeHints;
  get scopeIcon() { return ServerHelper.scopeIcons[this.model.scope]; }
  get scopeHint() { return ServerHelper.scopeHints[this.model.scope]; }
  cancel: IReactiveCommand<void>;
  launch: IReactiveCommand<void>;
  host: IReactiveCommand<void>;
  settings;
  status: IJobInfo;
  State = State;

  activate(model: IModel) {
    this.settings = getArma3Settings();
    super.activate(Object.assign({
      adminPassword: null,
      commsUrl: null,
      description: null,
      files: null,
      homepageUrl: null,
      launchAsDedicated: true,
      name: `${this.w6.userInfo.displayName}'s server`,
      password: null,
      scope: CollectionScope.Public,
    }, model));

    this.subscriptions.subd(d => {
      const changedObs = this.listFactory.getObserveAll(this.model).map(x => true);
      d(this.toProperty(changedObs, x => x.changed));
      d(this.cancel = uiCommand2("Cancel", this.performCancel, { cls: "cancel" }));
      d(this.launch = uiCommand2("Launch Server",
        this.handleLaunch,
        { cls: "ok", isVisibleObservable: this.whenAnyValue(x => x.model.launch).map(x => x != null) }));
      d(this.host = uiCommand2("Host Server",
        this.handleHost, {
          cls: "ok", isVisibleObservable: //this.whenAnyValue(x => x.model.host).map(x => x != null).combineLatest(
          this.whenAnyValue(x => x.model.launchAsDedicated), //, (x, y) => x && y),
        }));
    });
  }
  async close() {
    this.changed = false;
    await this.controller.ok();
  }

  performCancel = async () => {
    this.changed = false;
    await this.controller.cancel(null);
  }
  performLaunch = async () => {
    await this.model.launch();
    await this.close();
  }
  performLaunchDedicated = async () => {
    await this.model.launchDedicated();
    await this.close();
  }
  handleLaunch = async () => {
    const t = this.model.launchAsDedicated ? this.performLaunchDedicated() : this.performLaunch();
    await new LaunchServer(this.w6.activeGame.id, this.model.scope).handle(this.mediator);
    await t;
  }
  handleHost = async () => {
    const jobId = await new HostW6Server(this.w6.activeGame.id, this.model).handle(this.mediator); //this.model.host(this.model);
    this.status = <any>{ state: State.Initializing };
    while (this.status.state < State.Running) {
      this.status = await new GetStatus(jobId).handle(this.mediator);
      await new Promise(res => setTimeout(() => res(), 2000));
    }
    if (this.status.state === State.Failed) { throw new Error(`Job failed: ${this.status.message}`); }
    //this.controller.ok();
  }
}

const getArma3DifficultySetting = (name: string) => {
  return {
    name,
    flags: [
      {
        name: "Armor",
        //type: "bool",
        defaultValue: true,
        description: "",
      },
      {
        name: "FriendlyTag",
        defaultValue: true,
      },
      {
        name: "EnemyTag",
        defaultValue: false,
      },
      {
        name: "MineTag",
        defaultValue: true,
      },
      {
        name: "HUD",
        defaultValue: true,
      },
      {
        name: "HUDPerm",
        defaultValue: true,
      },
      {
        name: "HUDWp",
        defaultValue: true,
      },
      {
        name: "HUDWpPerm",
        defaultValue: true,
      },
      {
        name: "HUDGroupInfo",
        defaultValue: true,
      },
      {
        name: "AutoSpot",
        defaultValue: true,
      },
      {
        name: "Map",
        defaultValue: true,
      },
      {
        name: "WeaponCursor",
        defaultValue: true,
      },
      {
        name: "AutoGuideAT",
        defaultValue: true,
      },
      {
        name: "ClockIndicator",
        defaultValue: true,
      },
      {
        name: "3rdPersonView",
        defaultValue: true,
      },
      {
        name: "UltraAI",
        defaultValue: false
      },
      {
        name: "CameraShake",
        defaultValue: false,
      },
      {
        name: "UnlimitedSaves",
        defaultValue: true,
      },
      {
        name: "DeathMessages",
        defaultValue: true,
      },
      {
        name: "NetStats",
        defaultValue: true,
      },
      {
        name: "VonID",
        defaultValue: true,
      },
      {
        name: "ExtendetInfoType",
        defaultValue: true,
      },
    ],
    values: [
      {
        name: "skillFriendly",
        defaultValue: 0.65,
        range: [0, 100]
      },
      {
        name: "skillEnemy",
        defaultValue: 40,
        range: [0, 100]
      },
      {
        name: "precisionFriendly",
        defaultValue: 37,
        range: [0, 100]
      },
      {
        name: "precisionEnemy",
        defaultValue: 10,
        range: [0, 100]
      },
    ]
  }
}

// https://community.bistudio.com/wiki/server.cfg
// "Bring your own configs?"
const getSettings = () => {
  return {
    motd: "My motd",
    maxPlayers: 10,
    upnp: 1,
    allowedFilePatching: 0, //(1,2)
    //disconnectTimeout: 5;
    // disableVoN = 1;
    // requiredBuild = xxxxx;
    /*
allowedVoteCmds[] = {
{"admin", true, true, 0.5},
{"missions", true, "true", "0.5"},
{"mission", true, true}, // will use global "voteThreshold"
{"kick", false, false, 0.75},
{"restart", false, true, -1}, // invalid threshold value. Will default to global "voteThreshold"
{"reassign", true, true, 0.5}
};
    */
    /*
battlEye = 1;
verifySignatures = 2;
allowedFilePatching = 0;
allowedLoadFileExtensions[] = {"hpp","sqs","sqf","fsm","cpp","paa","txt","xml","inc","ext","sqm","ods","fxy","lip","csv","kb","bik","bikb","html","htm","biedi"};
allowedPreprocessFileExtensions[] = {"hpp","sqs","sqf","fsm","cpp","paa","txt","xml","inc","ext","sqm","ods","fxy","lip","csv","kb","bik","bikb","html","htm","biedi"};
allowedHTMLLoadExtensions[] = {"htm","html","xml","txt"};
//allowedHTMLLoadURIs[] = {};
// MISSIONS CYCLE (see below)
class Missions {};				// An empty Missions class means there will be no mission rotation
 
missionWhitelist[] = {}; //an empty whitelist means there is no restriction on what missions' available
forcedDifficulty = "<difficultyClass>";     
    */
    BattlEye: 1,
    forceRotorLibSimulation: 0,//  [0, 2] UpToPlayer, ForceAFM, ForceSFM
    vonCodecQuality: 12, // [1, 30]
  }
}

const getArma3Difficulty = () => {
  return [
    getArma3DifficultySetting('recruit'),
    getArma3DifficultySetting('regular'),
    getArma3DifficultySetting('veteran'),
    getArma3DifficultySetting('mercenary'),
  ]
}

const getArma3Settings = () => {
  return [
    {
      name: "difficulties",
      values: getArma3Difficulty(),
    },
  ];
};

//interface IHostServerInfo { address: string }

class HostW6Server extends Command<string> {
  constructor(public gameId: string, public serverInfo) { super(); }
}

@handlerFor(HostW6Server)
class HostW6ServerHandler extends DbQuery<HostW6Server, string> {
  handle(request: HostW6Server) {
    return this.context.postCustom<string>("/server-manager/jobs", request);
  }
}

class GetStatus extends Query<IJobInfo> { constructor(public id: string) { super(); } }

@handlerFor(GetStatus)
class GetStatusHandler extends DbQuery<GetStatus, IJobInfo> {
  handle(request: GetStatus) {
    return this.context.getCustom(`/server-manager/jobs/${request.id}`);
  }
}

class LaunchServer extends VoidCommand {
  constructor(public gameId: string, public scope: CollectionScope) { super(); }
}

@handlerFor(LaunchServer)
class LaunchServerHandler extends DbQuery<LaunchServer, void> {
  handle(request: LaunchServer) {
    return this.context.postCustom<void>("servers/jobs", request);
  }
}