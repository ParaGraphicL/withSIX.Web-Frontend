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

  async activate(model) {
    model = { input: await new GetUserInfo().handle(this.mediator), output: {} }
    super.activate(model);

    this.save = uiCommand2("Save", this.saveInternal, { cls: 'ok' });
    this.cancel = uiCommand2('Cancel', async () => this.controller.cancel(false), { cls: "cancel" });
  }

  onFileSelected(event) {
    var selectedFile = event.target.files[0];
    var reader = new FileReader();
    this.imgTitle = selectedFile.name;

    reader.onload = (event) => {
      this.imgSrc = (<any>event.target).result;
    };

    reader.readAsDataURL(selectedFile);
  }

  saveInternal = async () => {
    this.model.output = { userName: await new Save(this.model.input).handle(this.mediator) }
    this.saved = true;
  }
}

class GetUserInfo extends Query<IInputReceive> { }

@handlerFor(GetUserInfo)
class GetUserInfoHandler extends DbQuery<GetUserInfo, IInputReceive> {
  handle(request: GetUserInfo) { return this.context.getCustom<IInputReceive>("/me/finalize") }
}

class Save extends Command<string> {
  constructor(public model: IInput) { super() }
}

@handlerFor(Save)
export class SaveHandler extends DbQuery<Save, string> {
  handle(request: Save) {
    let fd = new FormData();
    fd.append('avatar', request.model.avatar);
    fd.append('email', request.model.email);
    fd.append('displayName', request.model.displayName);
    fd.append('birthday', request.model.birthday);
    fd.append('password', request.model.password);
    return this.context.postCustomFormData<string>("/me/finalize", fd);
  }
}
