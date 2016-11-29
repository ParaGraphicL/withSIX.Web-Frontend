import { DbQuery, Query, VoidCommand, W6Context, handlerFor, uiCommand2 } from "../../../framework";
import { ITabModel, ServerFileUploader, ServerTab } from "../rside-bar";
import { inject } from "aurelia-framework";

interface IModsTabModel extends ITabModel<any> { }
export class Index extends ServerTab<IModsTabModel> {
  keys: Map<string, string>;
  files: FileList;

  upload = uiCommand2("Upload key", async () => {
    const file = this.files[0];
    const fr = new FileReader();
    const p = new Promise<string>((resolve, rej) => {
      fr.onload = () => resolve(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
    const dataUrl = await p;
    await new UploadKey(file.name, dataUrl.substring(fr.result.indexOf(",") + 1)).handle(this.mediator);
    // todo; reset files
    await this.refresh();
  }, { cls: "ignore-close", canExecuteObservable: this.whenAnyValue(x => x.files.length).map(x => x > 0) });

  async activate(model) {
    super.activate(model);
    if (this.signaturesEnabled) {
      await this.refresh();
    }
  }

  get signaturesEnabled() { return this.server.settings.verifySignatures; }

  async refresh() {
    const keys = await new GetKeys().handle(this.mediator);
    this.keys = keys.toMap(x => x);
  }

  async removeKey(m) {
    await new DeleteKey(m).handle(this.mediator);
    this.keys.delete(m);
  }

  get mods() { return this.server.mods; }

  remove(m) { this.mods.delete(m.id); }

}

class GetKeys extends Query<string[]> { }

@handlerFor(GetKeys)
@inject(W6Context, ServerFileUploader)
class GetKeysHandler extends DbQuery<GetKeys, string[]> {
  constructor(ctx: W6Context, private uploader: ServerFileUploader) { super(ctx); }

  handle(request: GetKeys) { return this.uploader.getFiles("keys", ".bikey"); }
}

class UploadKey extends VoidCommand { constructor(public fileName: string, public fileContent: string) { super(); } }

@handlerFor(UploadKey)
@inject(W6Context, ServerFileUploader)
class UploadKeyHandler extends DbQuery<UploadKey, void> {
  constructor(ctx: W6Context, private uploader: ServerFileUploader) { super(ctx); }

  handle(request: UploadKey) { return this.uploader.uploadFile("keys", request.fileName, request.fileContent); }
}

class DeleteKey extends VoidCommand { constructor(public fileName: string) { super(); } }

@handlerFor(DeleteKey)
@inject(W6Context, ServerFileUploader)
class DeleteKeyHandler extends DbQuery<DeleteKey, void> {
  constructor(ctx: W6Context, private uploader: ServerFileUploader) { super(ctx); }

  handle(request: DeleteKey) { return this.uploader.deleteFile("keys", request.fileName); }
}
