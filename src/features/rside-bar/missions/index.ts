import { ITabModel, ServerTab } from "../rside-bar";

interface IMissionsTabModel extends ITabModel<any> { }

export class Index extends ServerTab<IMissionsTabModel> { }

