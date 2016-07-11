import {Dialog, uiCommand2, Command, Query, DbQuery, handlerFor} from '../../framework';

interface IInputReceive {
  displayName: string, email: string, birthday: Date;
}

interface IInput extends IInputReceive {
  password: string, avatar: File
}

interface IOutput { userName: string }

export class Finalize extends Dialog<{ input: IInput; output: IOutput }> {
  save;
  saved = false;
  imgSrc;
  imgTitle: string;
  cancel;
  files: FileList;

  async activate(model) {
    model = { input: await new GetUserInfo().handle(this.mediator), output: {} }
    super.activate(model);

    this.save = uiCommand2("Save", this.saveInternal, { cls: 'ok' });
    this.cancel = uiCommand2('Cancel', async () => this.controller.cancel(false), { cls: "cancel" });
  }

  saveInternal = async () => {
    this.model.input.avatar = !this.files || this.files.length == 0 ? null : this.files[0];
    this.model.output = { userName: await new Save(this.model.input).handle(this.mediator) }
    this.saved = true;
  }
}

class GetUserInfo extends Query<IInputReceive> { }

@handlerFor(GetUserInfo)
class GetUserInfoHandler extends DbQuery<GetUserInfo, IInputReceive> {
  handle(request: GetUserInfo) { return this.context.getCustom<IInputReceive>("me/finalize") }
}

class Save extends Command<string> {
  constructor(public model: IInput) { super() }
}

@handlerFor(Save)
export class SaveHandler extends DbQuery<Save, string> {
  handle(request: Save) {
    let fd = new FormData();
    // todo; object to formData?
    this.appendIfNotNull(fd, 'avatar', request.model.avatar);
    this.appendIfNotNull(fd, 'email', request.model.email);
    this.appendIfNotNull(fd, 'displayName', request.model.displayName);
    this.appendIfNotNull(fd, 'birthday', request.model.birthday);
    this.appendIfNotNull(fd, 'password', request.model.password);
    return this.context.postCustomFormData<string>("me/finalize", fd);
  }

  appendIfNotNull(fd: FormData, key, value) {
    if (value != null) fd.append(key, value);
  }
}
