import {Dialog, Command, DbQuery, handlerFor, uiCommand2} from '../../../framework'
import {UploadCover, UploadLogo} from './home/index';
import {ValidationGroup} from 'aurelia-validation';

interface IGroup {
  name: string;
  homepage: string;
  initialMembers: string[];
  cover: File[];
  logo: File[];
}

export class NewGroupDialog extends Dialog<IGroup> {
  validation: ValidationGroup;
  activate() {
    super.activate({
      name: null,
      homepage: null,
      initialMembers: [],
      cover: [],
      logo: []
    });
    //let debouncer = Debouncer.debouncePromise(async (newValue) => { let exists = await new CollectionExists(newValue, this.game.id).handle(this.mediator); return !exists }, 250);
    this.validation = this.validator.on(this)
      .ensure('model.name')
      .isNotEmpty()
      .hasMinLength(3)
      .hasMaxLength(255)
      .ensure('model.homepage')
      .isURL();
    //.passes(debouncer, 250)
    //.withMessage("you already own a collection with this name");
  }
  ok = uiCommand2("ok", async () => {
    try {
      await this.validation.validate();
    } catch (err) {
      this.toastr.warning("Please correct the inputs", "Invalid input");
      return;
    }
    let id = await new CreateGroup(this.model).handle(this.mediator);
    if (this.model.logo && this.model.logo.length > 0) await new UploadLogo(id, this.model.logo[0]).handle(this.mediator);
    if (this.model.cover && this.model.cover.length > 0) await new UploadCover(id, this.model.cover[0]).handle(this.mediator);
    this.navigateInternal(`/me/groups/${id.toShortId()}/${this.model.name.sluggifyEntityName()}`);
    this.controller.ok(null);
  }, { cls: "ok" });
  cancel = uiCommand2('Cancel', () => this.controller.cancel(null), { cls: "cancel" });
}

export class CreateGroup extends Command<string> {
  constructor(public model: IGroup) { super() }
}

@handlerFor(CreateGroup)
export class CreateGroupHandler extends DbQuery<CreateGroup, string> {
  async handle(request: CreateGroup): Promise<string> {
    let postModel = Object.assign({}, request.model);
    const urlRx = /^https?:\/\//i;
    if (postModel.homepage && !urlRx.test(postModel.homepage)) postModel.homepage = "http://" + postModel.homepage;
    return await this.context.postCustom<string>("groups", postModel);
  }
}
