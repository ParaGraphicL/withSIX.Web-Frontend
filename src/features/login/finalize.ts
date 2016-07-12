import {Dialog, uiCommand2, Command, Query, DbQuery, handlerFor} from '../../framework';
import {ensure, ValidationGroupBuilder, ValidationGroup, Validation} from 'aurelia-validation';

interface IInputReceive {
  displayName: string, email: string, birthday: Date;
}

interface IInput extends IInputReceive {
  password: string, avatar: File
}

interface IOutput { userName: string }

export class Finalize extends Dialog<IInput> {
  save;
  cancel;
  files: FileList;
  validation: ValidationGroup;

  async activate(model: IInput) {
    model = <IInput>(await new GetUserInfo().handle(this.mediator));
    super.activate(model);

    let initialEmail: string = model.email.toLowerCase();

    this.save = uiCommand2("Submit", this.saveInternal, { cls: 'ok' });
    this.cancel = uiCommand2('Abort', async () => this.controller.cancel(false), { cls: "cancel" });
    this.validation = this.validator.on(this)
      .ensure('model.email')
      .isNotEmpty()
      .isEmail()
      .passes(async (x: string) => { return x.toLowerCase() === initialEmail || !(await new EmailExists(x).handle(this.mediator)) }, 250)
      .withMessage("email already in use")
      .ensure('model.emailConfirmation')
      .isNotEmpty()
      .passes((x: string) => x === this.model.email)
      .withMessage("Please confirm the email address")
      .ensure('model.displayName')
      .isNotEmpty()
      .hasMinLength(3)
      .hasMaxLength(150)
      .ensure('model.password')
      .isNotEmpty()
      .hasMinLength(6)
      .hasMaxLength(255)
      .passes(this.isComplexPassword)
      .withMessage('Requires at least one lower case character, one upper case character and one digit')
      .ensure('model.passwordConfirmation')
      .isNotEmpty()
      .passes((x: string) => x === this.model.password)
      .withMessage("Please confirm the password");

    // .ensure('model.birthday')
    //   .isNotEmpty();
    ;
  }

  isComplexPassword = (p: string) => {
    if (!p) return false;
    if (!p.match(/[a-z]/)) return false;
    if (!p.match(/[A-Z]/)) return false;
    if (!p.match(/[0-9]/)) return false;
    return true;
  }

  saveInternal = async () => {
    try {
      await this.validation.validate();
    } catch (err) {
      this.toastr.warning("Please correct the inputs", "Invalid input");
      return;
    }
    this.model.avatar = !this.files || this.files.length == 0 ? null : this.files[0];
    let userName = await new Save(this.model).handle(this.mediator);
    this.w6.userInfo.passwordSet = true;
    this.router.navigate(`/u/${userName.sluggifyEntityName()}`);
    this.controller.ok(true);
    if (await this.toastr.success("Please check your Email and click on the Activation link within, to complete the verification process. Or click here to resend", "Almost done", { timeOut: 0 }))
      this.router.navigate(`/login/verify?email=${this.model.email}`);
  }
}

class UserNameExists extends Query<boolean> { constructor(public userName: string) { super(); } }

@handlerFor(UserNameExists)
class UserNameExistsHandler extends DbQuery<UserNameExists, boolean> {
  handle(request: UserNameExists) {
    return this.context.userNameExistsCached(request.userName);
  }
}

class EmailExists extends Query<boolean> { constructor(public email: string) { super(); } }

@handlerFor(EmailExists)
class EmailExistsHandler extends DbQuery<EmailExists, boolean> {
  handle(request: EmailExists) {
    return this.context.emailExistsCached(request.email);
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
    this.appendIfNotNull(fd, 'birthday', request.model.birthday ? request.model.birthday.toISOString() : request.model.birthday);
    this.appendIfNotNull(fd, 'password', request.model.password);
    return this.context.postCustomFormData<string>("me/finalize", fd);
  }

  appendIfNotNull(fd: FormData, key, value) {
    if (value != null) fd.append(key, value);
  }
}
