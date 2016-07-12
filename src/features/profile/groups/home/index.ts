import {IBreezeAWSUploadPolicy, UiContext, ViewModel, Mediator, DbQuery, Query, Command, VoidCommand, handlerFor, uiCommand2, bindingEngine, EditConfig, IDisposable} from '../../../../framework'
import {ValidationGroup} from 'aurelia-validation';

export interface IGroup {
  id: string;
  name: string;
  avatarUrl: string;
  avatarUpdatedAt: Date;
  backgroundUrl: string;
  backgroundUpdatedAt: Date;
  ownerId: string;
  homepage: string;
  joinToken?: string;
}

export class Index extends ViewModel {
  group: IGroup = <IGroup>{}
  originalGroup: IGroup;
  slug: string;
  shortId: string;
  validation: ValidationGroup;
  uploadModel: { cover: FileList, logo: FileList } = { cover: null, logo: null }
  editConfig = new EditConfig();
  joinToken: string;
  headerName = "Home";

  get isAdmin() { return this.w6.userInfo.id == this.group.ownerId; }

  generateNewJoinToken = uiCommand2("Generate new", async () => {
    if (!(await this.confirm("This will invalidate the existing join token, and will require you to inform new users of the new token"))) return;
    await new GenerateNewJoinToken(this.group.id).handle(this.mediator);
    //this.group.joinToken =
    //this.updateJoinToken();
    await this.handleWatch(async () => {
      await this.refreshGroup(this.group.id); // pff
    });
  });

  watch: IDisposable;

  get avatarUrl() { return this.w6.url.processAssetVersion(this.group.avatarUrl, this.group.avatarUpdatedAt) }
  get backgroundUrl() { return this.w6.url.processAssetVersion(this.group.backgroundUrl, this.group.backgroundUpdatedAt) }

  setupWatch = () => this.subscriptions.subd(d => d(this.watch = this.toProperty(this.listFactory.getObserveAll(this.group).select(x => true), x => x.changed)))

  async refreshGroup(id: string) {
    let group = await new GetGroup(id).handle(this.mediator);
    this.originalGroup = Object.assign({}, { id: null, name: null, backgroundUrl: null, avatarUrl: null, ownerId: null, homepage: null }, group);
    this.group = group;
    this.updateJoinToken();
  }

  updateJoinToken = () => this.joinToken = `http:${this.w6.url.url}/me/groups/${this.shortId}/${this.slug}/join/${this.group.joinToken}`;

  copyJoinToken = uiCommand2("copy to clipboard", () => this.copyToClipboard(this.joinToken))

  async activate(params, routeConfig) {
    this.slug = params.slug;
    this.shortId = params.id;

    let id = this.tools.fromShortId(params.id);
    await this.refreshGroup(id);
    if (this.isAdmin) this.setupWatch();
    this.subscriptions.subd(d => {
      d(this.deleteGroup);
      d(this.leaveGroup);
      d(this.save);
      d(this.editConfig);
    });
    if (this.isAdmin) {
      //let debouncer = Debouncer.debouncePromise(async (newValue) => { let exists = await new CollectionExists(newValue, this.game.id).handle(this.mediator); return !exists }, 250);
      this.validation = this.validator.on(this)
        .ensure('group.name')
        .isNotEmpty()
        .hasMinLength(3)
        .hasMaxLength(255)
        .ensure('group.homepage')
        .isURL();
      //.passes(debouncer, 250)
      //.withMessage("you already own a collection with this name");
    }
  }

  logoSelected = ($event) => {
    this.tools.Debug.log("logoSelected: ", $event);
    let file = $event.target.files[0];
    if (file == null) this.group.avatarUrl = this.originalGroup.avatarUrl;
    else this.group.avatarUrl = URL.createObjectURL(file);
    this.changed = true;
  }

  coverSelected = ($event) => {
    this.tools.Debug.log("coverSelected: ", $event);
    let file = $event.target.files[0];
    if (file == null) this.group.backgroundUrl = this.originalGroup.backgroundUrl;
    else this.group.backgroundUrl = URL.createObjectURL(file);
    this.changed = true;
  }

  deleteGroup = uiCommand2("Delete", async () => {
    if (!(await this.confirm("Do you really want to delete the group?"))) return;
    await new DeleteGroup(this.group.id).handle(this.mediator);
    this.navigateInternal("/me/groups")
  }, { cls: 'danger' });

  leaveGroup = uiCommand2("Leave", async () => {
    if (!(await this.confirm("Do you really want to leave the group?"))) return;
    await new LeaveGroup(this.group.id).handle(this.mediator);
    this.navigateInternal("/me/groups");
  }, { cls: 'warn' });

  handleWatch = async (fnc: () => Promise<any>) => {
    // We have to suspend watching, because there's a delay
    // TODO: How to clear selected files?
    if (this.watch) this.watch.dispose();
    try {
      await fnc();
    } finally {
      this.setupWatch();
    }
  }

  save = uiCommand2("Save Changes", async () => {
    try {
      await this.validation.validate();
    } catch (err) {
      this.toastr.warning("Please correct the inputs", "Invalid input");
      return;
    }
    await this.handleWatch(async () => {
      //this.group = Object.assign({}, this.group);
      await new SaveChanges(this.group).handle(this.mediator);
      let cover = this.uploadModel.cover;
      if (cover && cover.length > 0) {
        if (cover[0].size < 1024 || cover[0].size > 5 * 1024 * 1024)
          throw new Error("Cover file size should be bigger than 1 KB, and smaller than 5 MB");
        await new UploadCover(this.group.id, cover[0]).handle(this.mediator);
      }
      let logo = this.uploadModel.logo;
      if (logo && logo.length > 0) {
        if (logo[0].size < 1024 || logo[0].size > 5 * 1024 * 1024)
          throw new Error("Logo file size should be bigger than 1 KB, and smaller than 5 MB");
        await new UploadLogo(this.group.id, logo[0]).handle(this.mediator);
      }
      // It seems that on Object.observe subcription disposal, if a new subscription is created on the same object,
      // then the old observer will be used and the change propagated even when the subscription was disposed when the change happened..
      await this.refreshGroup(this.group.id); // To receive any changes the server might have... and also means we don't require Object.assign approaches
      //this.originalGroup = Object.assign({}, this.group);
    });
    this.changed = false;
    this.editConfig.close();
  }, { cls: 'ok', canExecuteObservable: this.observeEx(x => x.changed) })

  cancel = uiCommand2("Cancel", async () => {
    if (!(await this.confirm("Are you sure you want to discard your changes?"))) return;
    await this.handleWatch(async () => this.group = Object.assign({}, this.originalGroup));
    this.changed = false;
    this.editConfig.close();
  }, { cls: 'cancel', canExecuteObservable: this.observeEx(x => x.changed) })

  close = uiCommand2("Close", async () => {
    this.editConfig.close();
  }, { cls: 'default', canExecuteObservable: this.observeEx(x => x.unchanged) })
}

export class GetGroup extends Query<IGroup> { constructor(public id: string) { super(); } }

@handlerFor(GetGroup)
export class GetGroupHandler extends DbQuery<GetGroup, IGroup> {
  async handle(request: GetGroup): Promise<IGroup> {
    return await this.context.getCustom<IGroup>("groups/" + request.id);
  }
}

export class LeaveGroup extends VoidCommand { constructor(public id: string) { super() } }

@handlerFor(LeaveGroup)
export class LeaveGroupHandler extends DbQuery<LeaveGroup, void> {
  async handle(request: LeaveGroup): Promise<void> {
    await this.context.deleteCustom<void>("groups/" + request.id + "/members/" + this.w6.userInfo.id);
  }
}

export class DeleteGroup extends VoidCommand { constructor(public id: string) { super() } }

@handlerFor(DeleteGroup)
export class DeleteGroupHandler extends DbQuery<DeleteGroup, void> {
  async handle(request: DeleteGroup): Promise<void> {
    await this.context.deleteCustom<void>("groups/" + request.id);
  }
}

export class SaveChanges extends VoidCommand { constructor(public group: IGroup) { super(); } }

@handlerFor(SaveChanges)
export class SaveChangesHandler extends DbQuery<SaveChanges, void> {
  async handle(request: SaveChanges) {
    let postModel = Object.assign({}, request.group);
    const urlRx = /^https?:\/\//i;
    if (postModel.homepage && !urlRx.test(postModel.homepage)) postModel.homepage = "http://" + postModel.homepage;
    let groupPath = "groups/" + request.group.id;
    await this.context.postCustom(groupPath, postModel);
  }
}

export class UploadCover extends VoidCommand { constructor(public id: string, public file: File) { super() } }

@handlerFor(UploadCover)
export class UploadCoverHandler extends DbQuery<UploadCover, void> {
  async handle(request: UploadCover) {
    let groupPath = "groups/" + request.id;
    let policy = await this.context.postCustom<IBreezeAWSUploadPolicy>(groupPath + "/banner-policy");
    await this.context.uploadToAmazonWithPolicy(request.file, policy);
    await this.context.postCustom(groupPath + "/banner-upload");
  }
}

export class UploadLogo extends VoidCommand { constructor(public id: string, public file: File) { super() } }

@handlerFor(UploadLogo)
export class UploadLogoHandler extends DbQuery<UploadLogo, void> {
  async handle(request: UploadLogo) {
    let groupPath = "groups/" + request.id;
    let policy = await this.context.postCustom<IBreezeAWSUploadPolicy>(groupPath + "/logo-policy");
    await this.context.uploadToAmazonWithPolicy(request.file, policy);
    await this.context.postCustom(groupPath + "/logo-upload");
  }
}

class GenerateNewJoinToken extends Command<string> { constructor(public id: string) { super() }; }

@handlerFor(GenerateNewJoinToken)
export class GenerateNewJoinTokenHandler extends DbQuery<GenerateNewJoinToken, string> {
  async handle(request: GenerateNewJoinToken): Promise<string> {
    let groupPath = "groups/" + request.id;
    return await this.context.postCustom<string>(groupPath + "/join-token");
  }
}
