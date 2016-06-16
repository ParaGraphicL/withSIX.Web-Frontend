import {inject} from 'aurelia-framework';
import {ViewModel, handlerFor, Query, VoidCommand, DbClientQuery, IGeneralSettings, Client, uiCommand2, UiContext} from '../../framework';

@inject(UiContext, Client)
export class General extends ViewModel {
  canceled: boolean;
  model: IGeneralSettings;

  constructor(ui, private client: Client) { super(ui); }

  async activate() {
    let r = await new GetGeneralSettings().handle(this.mediator);
    this.model = r;
    this.subscriptions.subd(d => {
      d(this.toProperty(this.listFactory.getObserveAll(this.model).select(x => true), x => x.changed));
    });
  }

  async canDeactivate() {
    if (!this.changed) return true;
    if (this.changed && await this.confirm("You have unsaved changes, do you want to save them first?"))
      await this.save();
    return true;
  }

  async unbind() {
    if (!this.canceled && this.changed) {
      if (await this.confirm("Do you want to save your changes?"))
        await this.save();
    }
    await super.unbind();
  }

  async deactivate() {
    this.tools.Debug.log("DEACTIVATE GENERAL");
    await super.deactivate();
  }

  async save() { await new SaveGeneralSettings(this.model).handle(this.mediator) }

  // TODO: command
  async ok() { await this.save(); this.eventBus.publish("closeSettingsDialogOk"); this.changed = false; }
  cancel() { this.canceled = true; this.eventBus.publish("closeSettingsDialogCancel") }

  get isExtensionInstalled() { return this.w6.miniClient.clientInfo && this.w6.miniClient.clientInfo.extensionInstalled }

  installExtension = uiCommand2("Install explorer folder synchronization", () => this.client.installExplorerExtension(), {
    tooltip: "This will allow you to start uploads directly from the Mod folder, using the right click menu",
    isVisibleObservable: this.observeEx(x => x.isExtensionInstalled).select(x => !x)
  });

  uninstallExtension = uiCommand2("Uninstall explorer folder synchronization", () => this.client.uninstallExplorerExtension(), {
    //tooltip: "This will allow you to start uploads directly from the Mod folder, using the right click menu",
    isVisibleObservable: this.observeEx(x => x.isExtensionInstalled)
  });

}

class GetGeneralSettings extends Query<IGeneralSettings> { }

@handlerFor(GetGeneralSettings)
class GetGeneralSettingsHandler extends DbClientQuery<GetGeneralSettings, IGeneralSettings> {
  handle(request: GetGeneralSettings) {
    return this.client.getGeneralSettings();
  }
}

class SaveGeneralSettings extends VoidCommand {
  constructor(public model: IGeneralSettings) { super(); }
}

@handlerFor(SaveGeneralSettings)
class SaveGeneralSettingsHandler extends DbClientQuery<SaveGeneralSettings, void> {
  handle(request: SaveGeneralSettings) {
    return this.client.saveGeneralSettings(request.model);
  }
}
