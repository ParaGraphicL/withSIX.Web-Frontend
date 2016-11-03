import { Environment, EnvironmentHost } from "./env";
import { W6 } from "./withSIX";
import { inject } from "aurelia-framework";
import { Tools } from "./tools";

@inject(W6)
export class FeatureToggles {
  loggedIn = this.w6.userInfo.id != null;
  private isManager = this.w6.userInfo.isManager || this.w6.userInfo.isAdmin;
  private syncFeatures = !this.w6.isClient;
  isTestEnvironment = EnvironmentHost.env !== Environment.Production;
  // private isPreviewEnvironment = window.location.hostname === "preview.withsix.com";
  private testingFlag = window.location.search.includes("testmode=1");
  private groupTestingFlag = window.location.search.includes("testgroupmode=1")
  || (!window.location.search.includes("testgroupmode=0") && this.isManager);
  private groupsInternal = this.groupTestingFlag || this.w6.userInfo.hasGroups;
  private get clientInfo() { return this.w6.miniClient.clientInfo; }
  private get isPrereleaseClient() { return this.clientInfo && this.clientInfo.version.includes("-"); }

  constructor(private w6: W6) { }

  get createServers() { return this.isTestEnvironment; }
  get listAvailable() { return this.isTestEnvironment; }
  get managerFeatures() { return this.w6.userInfo.isManager || this.adminFeatures; }
  get adminFeatures() { return this.w6.userInfo.isAdmin; }
  get clientAutostart() { return !this.isTestEnvironment; }
  get groups() { return this.groupsInternal; }
  set groups(value) { this.groupsInternal = value; }
  get notifications() { return this.isManager; }
  get library() { return this.syncFeatures; }
  get quickActions() { return this.isTestEnvironment; }
  get uiVirtualization() { return this.testingFlag; }
  get isClientConnected() { return this.w6.miniClient.isConnected }
  get serverFeatures() {
    return !this.isClientConnected ||
      (this.clientInfo.version && (Tools.versionCompare(this.clientInfo.version, "1.7.0") >= 0));
  }
}
