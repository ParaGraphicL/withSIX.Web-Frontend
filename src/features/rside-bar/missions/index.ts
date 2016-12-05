import { DbQuery, Query, VoidCommand, W6Context, handlerFor, uiCommand2 } from "../../../framework";
import { ITabModel, ServerFileUploader, ServerTab } from "../rside-bar";
import { inject } from "aurelia-framework";

interface IMissionsTabModel extends ITabModel<any> { }

export class Index extends ServerTab<IMissionsTabModel> {
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

  async activate(model) {
    super.activate(model);
    await this.refresh();
  }

  async refresh() {
    const missions = await new GetMissions().handle(this.mediator);
    this.server.missions = missions.toMapValue(x => x, x => { return { id: x }; });
  }

  async remove(m) {
    await new DeleteMission(m.id).handle(this.mediator);
    this.missions.delete(m.id);
  }
}

class GetMissions extends Query<string[]> { }

@handlerFor(GetMissions)
@inject(W6Context, ServerFileUploader)
class GetMissionsHandler extends DbQuery<GetMissions, string[]> {
  constructor(ctx: W6Context, private uploader: ServerFileUploader) { super(ctx); }

  handle(request: GetMissions) { return this.uploader.getFiles("missions", ".pbo"); }
}

class UploadMission extends VoidCommand { constructor(public fileName: string, public fileContent: string) { super(); } }

@handlerFor(UploadMission)
@inject(W6Context, ServerFileUploader)
class UploadMissionHandler extends DbQuery<UploadMission, void> {
  constructor(ctx: W6Context, private uploader: ServerFileUploader) { super(ctx); }

  handle(request: UploadMission) { return this.uploader.uploadFile("missions", request.fileName, request.fileContent); }
}

class DeleteMission extends VoidCommand { constructor(public fileName: string) { super(); } }

@handlerFor(DeleteMission)
@inject(W6Context, ServerFileUploader)
class DeleteMissionHandler extends DbQuery<DeleteMission, void> {
  constructor(ctx: W6Context, private uploader: ServerFileUploader) { super(ctx); }

  handle(request: DeleteMission) { return this.uploader.deleteFile("missions", request.fileName); }
}
