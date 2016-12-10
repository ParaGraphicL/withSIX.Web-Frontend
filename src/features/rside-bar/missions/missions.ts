import { DbQuery, Query, ViewModel, VoidCommand, W6Context, handlerFor, uiCommand2 } from "../../../framework";
import { ServerHandler } from "../control/actions/base";
import { ITabModel } from "../rside-bar";
import { inject } from "aurelia-framework";

interface IMissionsTabModel extends ITabModel<any> { }

export class Missions extends ViewModel {
  server;
  get missions() { return this.server.missions; }

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
  }, { cls: "ignore-close", canExecuteObservable: this.whenAnyValue(x => x.files.length).map(x => x > 0) });

  async activate(server) {
    this.server = server;
    await this.refresh();
  }

  async refresh() {
    const missions = await new GetMissions().handle(this.mediator);
    this.server.missions = missions.toMapValue(x => x, id => ({ id }));
  }

  async remove(m) {
    await new DeleteMission(m.id).handle(this.mediator);
    this.missions.delete(m.id);
  }
}

class GetMissions extends Query<string[]> { }

@handlerFor(GetMissions)
class GetMissionsHandler extends ServerHandler<GetMissions, string[]> {
  handle(request: GetMissions) { return this.client.uploader.getFiles("missions", ".pbo"); }
}

class UploadMission extends VoidCommand { constructor(public fileName: string, public fileContent: string) { super(); } }

@handlerFor(UploadMission)
class UploadMissionHandler extends ServerHandler<UploadMission, void> {
  handle(request: UploadMission) { return this.client.uploader.uploadFile("missions", request.fileName, request.fileContent); }
}

class DeleteMission extends VoidCommand { constructor(public fileName: string) { super(); } }

@handlerFor(DeleteMission)
class DeleteMissionHandler extends ServerHandler<DeleteMission, void> {
  handle(request: DeleteMission) { return this.client.uploader.deleteFile("missions", request.fileName); }
}
