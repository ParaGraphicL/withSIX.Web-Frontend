import { DbQuery, Query, ViewModel, VoidCommand, W6Context, handlerFor, uiCommand2 } from "../../../framework";
import { ServerHandler } from "../control/actions/base";
import { inject } from "aurelia-framework";

export class BiKeys extends ViewModel {
  keys: Map<string, string>;
  files: FileList;
  server;

  async activate(server) {
    this.server = server;
    await this.refresh();
  }

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

  async refresh() {
    const keys = await new GetKeys().handle(this.mediator);
    this.keys = keys.toMap(x => x);
  }

  async removeKey(m) {
    await new DeleteKey(m).handle(this.mediator);
    this.keys.delete(m);
  }
}

class GetKeys extends Query<string[]> { }

@handlerFor(GetKeys)
class GetKeysHandler extends ServerHandler<GetKeys, string[]> {
  handle(request: GetKeys) { return this.client.uploader.getFiles("keys", ".bikey"); }
}

class UploadKey extends VoidCommand { constructor(public fileName: string, public fileContent: string) { super(); } }

@handlerFor(UploadKey)
class UploadKeyHandler extends ServerHandler<UploadKey, void> {
  handle(request: UploadKey) { return this.client.uploader.uploadFile("keys", request.fileName, request.fileContent); }
}

class DeleteKey extends VoidCommand { constructor(public fileName: string) { super(); } }

@handlerFor(DeleteKey)
class DeleteKeyHandler extends ServerHandler<DeleteKey, void> {
  handle(request: DeleteKey) { return this.client.uploader.deleteFile("keys", request.fileName); }
}
