import { ITabModel, ServerTab } from "../rside-bar";

interface IStatsTab extends ITabModel<any> { }
export class Index extends ServerTab<IStatsTab> {}