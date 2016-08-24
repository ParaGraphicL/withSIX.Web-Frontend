import {W6} from './withSIX';
import {EnvironmentHost, Environment} from './env';
import {inject} from 'aurelia-framework';

@inject(W6)
export class FeatureToggles {
  constructor(private w6: W6) { }

  private isManager = this.w6.userInfo.isManager || this.w6.userInfo.isAdmin;
  private syncFeatures = !this.w6.isClient;
  private isTestEnvironment = EnvironmentHost.env != Environment.Production;
  private isPreviewEnvironment = window.location.hostname === 'preview.withsix.com';
  private testingFlag = window.location.search.includes('testmode=1');
  private groupTestingFlag = window.location.search.includes('testgroupmode=1') || (!window.location.search.includes('testgroupmode=0') && this.isManager);
  private _groups = this.groupTestingFlag;
  private get clientInfo() { return this.w6.miniClient.clientInfo }
  private get isPrereleaseClient() { return this.clientInfo && this.clientInfo.version.includes('-') }
  loggedIn = this.w6.userInfo.id != null;

  get managerFeatures() { return this.w6.userInfo.isManager || this.adminFeatures }
  get adminFeatures() { return this.w6.userInfo.isAdmin }
  get clientAutostart() { return !this.isTestEnvironment }
  get servers() { return this.isTestEnvironment }
  get groups() { return this._groups; }
  set groups(value) { this._groups = value; }
  get notifications() { return this.isManager }
  get library() { return this.syncFeatures }
  get quickActions() { return this.isTestEnvironment }
  get uiVirtualization() { return this.testingFlag }
}
