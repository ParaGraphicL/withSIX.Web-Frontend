import { ITabModel, ServerTab } from "../rside-bar";
import { DbQuery, Query, Command, VoidCommand, handlerFor, uiCommand2 } from "../../../framework"

interface IMissionsTabModel extends ITabModel<any> { }

export class Index extends ServerTab<IMissionsTabModel> {
  get missions() { return this.server.missions; }

  async activate(model) {
    super.activate(model);
    await this.refresh();
  }

  async refresh() {
    const missions = await new GetMissions().handle(this.mediator);
    this.server.missions = missions.toMap(x => x);
  }

  files: FileList;

  upload = uiCommand2("Upload mission", async () => {
    const file = this.files[0];
    const fr = new FileReader();
    const p = new Promise<string>((resolve, rej) => {
      fr.onload = () => resolve(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
    const dataUrl = await p;
    await new UploadMission(file.name, dataUrl.substring(fr.result.indexOf(",") + 1)).handle(this.mediator);
    // todo; reset files
    await this.refresh();
  }, { canExecuteObservable: this.whenAnyValue(x => x.files.length).map(x => x > 0) });

  async remove(m) {
    await new DeleteMission(m).handle(this.mediator);
    this.missions.delete(m);
  }
}

class GetMissions extends Query<string[]> { }

@handlerFor(GetMissions)
class GetMissionsHandler extends DbQuery<GetMissions, string[]> {
  handle(request: GetMissions) {
    return this.context.getCustom<string[]>("/server-manager/files");
  }
}

class UploadMission extends VoidCommand {
  constructor(public fileName: string, public fileContent: string) { super(); }
}

@handlerFor(UploadMission)
class UploadMissionHandler extends DbQuery<UploadMission, void> {
  handle(request: UploadMission) {
    return this.context.postCustom<void>(`/server-manager/files/${request.fileName}`, { fileContent: request.fileContent });
  }
}

class DeleteMission extends VoidCommand {
  constructor(public fileName: string) { super(); }
}

@handlerFor(DeleteMission)
class DeleteMissionHandler extends DbQuery<DeleteMission, void> {
  handle(request: DeleteMission) {
    return this.context.deleteCustom<void>(`/server-manager/files/${request.fileName}`);
  }
}
