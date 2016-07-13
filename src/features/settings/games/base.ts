import {inject} from 'aurelia-framework';
import {ViewModel, handlerFor, Query, VoidCommand, DbClientQuery, IGameSettingsEntry, IGameSettings} from '../../../framework';

export abstract class GameSettingsVM<T extends IGameSettingsBase> extends ViewModel {
  model: T;
  gameId: string;

  async activate(model: IGameSettingsEntry) {
    this.gameId = model.id;
    let r = await new GetGameSettings<T>(model.id).handle(this.mediator);
    this.model = r.settings;
    this.subscriptions.subd(d => {
      d(this.toProperty(this.listFactory.getObserveAll(this.model).map(x => true), x => x.changed));
    });
  }

  async canDeactivate() {
    if (!this.changed) return true;
    if (this.changed && await this.confirm("You have unsaved changes, do you want to save them first?"))
      await this.save();
    return true;
  }

  canceled: boolean;

  async unbind() {
    if (!this.canceled && this.changed) {
      if (await this.confirm("Do you want to save your changes?"))
        await this.save();
    }
    await super.unbind();
  }

  browseDir(current) { return this.api.showOpenDialog({ defaultPath: current, properties: ['openDirectory'] }); }
  async browseGameDirectory() { let x = await this.browseDir(this.model.gameDirectory); x ? this.model.gameDirectory = x : null }
  async browseRepoDirectory() { let x = await this.browseDir(this.model.repoDirectory); x ? this.model.repoDirectory = x : null }
  openStartupParameters() { alert("TODO"); }
  async save() { await new SaveGameSettings<T>(this.gameId, this.model).handle(this.mediator); this.changed = false; }
  async ok() { await this.save(); this.eventBus.publish("closeSettingsDialogOk") }
  cancel() { this.canceled = true; this.eventBus.publish("closeSettingsDialogCancel") }
}

class GetGameSettings<T> extends Query<IGameSettings<T>> {
  constructor(public gameId: string) { super(); }
}

@handlerFor(GetGameSettings)
class GetGameSettingsHandler<T> extends DbClientQuery<GetGameSettings<T>, IGameSettings<T>> {
  handle(request: GetGameSettings<T>) {
    return this.client.getGameSettings<T>(request.gameId);
  }
}

class SaveGameSettings<T extends IGameSettingsBase> extends VoidCommand {
  constructor(public gameId: string, public model: T) { super(); }
}

@handlerFor(SaveGameSettings)
class SaveGameSettingsHandler<T extends IGameSettingsBase> extends DbClientQuery<SaveGameSettings<T>, void> {
  handle(request: SaveGameSettings<T>) {
    return this.client.saveGameSettings(request.gameId, request.model);
  }
}

export function type2(nameOrConfig, key?, descriptor?): any {
  let deco = function(target, key2, descriptor2) {
  }

  if (!nameOrConfig)
    return deco;
  var target = nameOrConfig;
  return deco(target, key, descriptor);
}

export interface IGameSettingsBase {
  gameDirectory: string;
  repoDirectory: string;
  startupLine: string;
}

export class GameSettings implements IGameSettingsBase {
  @type2("path") gameDirectory: string;
  @type2("path") repoDirectory: string;
  startupLine: string;
}

export interface IGameSettingsPackage {
  packageDirectory: string;
}

export class GameSettingsWithPackage extends GameSettings implements IGameSettingsPackage {
  @type2("path") packageDirectory: string;
}
