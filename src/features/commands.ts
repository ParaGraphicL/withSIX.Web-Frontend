import { Tools, handlerFor, VoidCommand, DbClientQuery, DbQuery, Mediator, W6Context, Client, BasketService, Notifier, uiCommand2, IContentGuidSpec } from '../services/lib';
import { inject } from 'aurelia-framework';

// TODO: Consider to move the download notifications to the Client api
// so that the information will be synchronized to all tabs, or at least where that game is active?

// TODO: These events should be generated by the domain instead.
// Preferably the Client itself, doing remote events. But otherwise domain services of the UI.
class BaseEvent { constructor(public gameId: string, public id: string) { } }
// We do use this one because collections are often grabbed from the Website list, and not from the client... in that case we still want lists to update..
export class ContentDeleted extends BaseEvent { }
// export class ContentLaunched extends BaseEvent {}
// export class ContentInstalled extends BaseEvent {}
//export class RecentRemoved extends BaseEvent {}
export class Aborted extends BaseEvent { }


interface INoteInfo {
  text: string;
  href?: string;
}

export class SubscribeCollection extends VoidCommand { constructor(public collectionId: string) { super(); } }

@inject(W6Context, Client, BasketService, Notifier, Mediator)
class ClientQuery<T, T2> extends DbClientQuery<T, T2> {
  constructor(context, client, bs, protected notifier: Notifier, protected mediator: Mediator) {
    super(context, client, bs);
  }
}

export enum LaunchAction {
  Default,
  Launch,
  Join,
  LaunchAsServer,
  LaunchAsDedicatedServer
}

export enum LaunchType {
  Default,
  Singleplayer,
  Multiplayer,
  Editor
}


export class LaunchGame extends VoidCommand {
  constructor(public id: string, public launchType: LaunchType = LaunchType.Default) { super(); }
  public action?: LaunchAction;
  public serverAddress?: string;
}

@handlerFor(LaunchGame)
class LaunchGameHandler extends DbClientQuery<LaunchGame, void> {
  public handle(request: LaunchGame): Promise<void> {
    return this.client.launchGame(request);
  }
}

@handlerFor(SubscribeCollection)
class SubscribeCollectionHandler extends DbClientQuery<SubscribeCollection, void> {
  async handle(request: SubscribeCollection): Promise<void> {
    await this.context.postCustom("collections/" + request.collectionId + "/subscribe");
  }
}

export class LaunchContent extends VoidCommand {
  public serverAddress?: string;
  constructor(public gameId: string, public id: string, public noteInfo: INoteInfo, public action = LaunchAction.Launch) { super(); }
}

@handlerFor(LaunchContent)
class LaunchContentHandler extends ClientQuery<LaunchContent, void> {
  async handle(request: LaunchContent): Promise<void> {
    //this.raiseDownloadNotification('Launching', null, request.noteInfo);
    await this.client.launchContent(<any>{
      gameId: request.gameId, content: { id: request.id }, action: request.action,
      name: request.noteInfo.text, href: request.noteInfo.href,
      serverAddress: request.serverAddress
    });
    // TODO: Add delay?
    //this.raiseDownloadNotification('Launched', null, request.noteInfo);
    //this.context.eventBus.publish(new ContentLaunched(request.gameId, request.id));
  }
}

export class LaunchContents extends VoidCommand {
  public serverAddress?: string;
  constructor(public gameId: string, public contents: IContentGuidSpec[], public noteInfo: INoteInfo,
    public action = LaunchAction.Launch) { super(); }
}

@handlerFor(LaunchContents)
class LaunchContentsHandler extends ClientQuery<LaunchContents, void> {
  async handle(request: LaunchContents): Promise<void> {
    //this.raiseDownloadNotification('Launching', null, request.noteInfo);
    await this.client.launchContents(<any>{
      gameId: request.gameId,
      contents: request.contents,
      name: request.noteInfo.text,
      href: request.noteInfo.href,
      action: request.action,
      serverAddress: request.serverAddress
    });
    // TODO: Add delay?
    //this.raiseDownloadNotification('Launched', null, request.noteInfo);
    //this.context.eventBus.publish(new ContentLaunched(request.gameId, request.id));
  }
}


export class FavoriteContent extends VoidCommand { constructor(public id: string) { super(); } }

@handlerFor(FavoriteContent)
class FavoriteContentHandler extends DbQuery<FavoriteContent, void> {
  public async handle(request: FavoriteContent) { }
}

export class UnFavoriteContent extends VoidCommand { constructor(public id: string) { super(); } }

@handlerFor(UnFavoriteContent)
class UnFavoriteContentHandler extends DbQuery<UnFavoriteContent, void> {
  public async handle(request: UnFavoriteContent) { }
}

export class RemoveRecent extends VoidCommand { constructor(public gameId: string, public id: string) { super(); } }

@handlerFor(RemoveRecent)
class RemoveRecentHandler extends DbClientQuery<RemoveRecent, void> {
  async handle(request: RemoveRecent) {
    await this.client.removeRecent(request);
    //this.context.eventBus.publish(new RecentRemoved(request.gameId, request.id));
  }
}

export enum FolderType {
  Default,
  Config
}

export class OpenFolder extends VoidCommand { constructor(public gameId: string, public id?: string, public folderType?: FolderType) { super() } }
@handlerFor(OpenFolder)
class OpenFolderHandler extends ClientQuery<OpenFolder, void> {
  handle(request: OpenFolder) { return this.client.openFolder(request); }
}

export class InstallContent extends VoidCommand { constructor(public gameId: string, public content: IContentGuidSpec, public noteInfo: INoteInfo, public hideLaunchAction?: boolean, public force?: boolean) { super(); } }

@handlerFor(InstallContent)
class InstallContentHandler extends ClientQuery<InstallContent, void> {
  async handle(request: InstallContent) {
    this.basketService.lastActiveItem = request.content.id;
    //this.raiseDownloadNotification(request.force ? 'Diagnosing' : 'Installing', null, request.noteInfo);
    //try {

    let req = {
      ...request,
      href: request.noteInfo.href,
      name: request.noteInfo.text,
    };
    if (request.content.isOnlineCollection) {
      if (this.w6.isLoggedIn) {
        // TODO: Don't subscribe when it's our own..
        try {
          await this.context.postCustom("collections/" + request.content.id + "/subscribe");
        } catch (err) {
          if (err instanceof Tools.HttpException) {
            if (err.status !== 400) throw err;
          }
        }
      }
      await this.client.installCollection(req);
    }
    else
      await this.client.installContent(req);
    //this.context.eventBus.publish(new ContentInstalled(request.gameId, request.content.id));
    //this.raiseDownloadNotification(request.force ? 'Diagnosed' : 'Installed', null, Object.assign({}, request.noteInfo, { command: this.createLaunchCommand(new LaunchContent(request.gameId, request.content.id, request.noteInfo)) }));
    //} catch (err) { this.handleFailure(request.noteInfo, request, err); }
  }
}

export class InstallContents extends VoidCommand { constructor(public gameId: string, public contents: IContentGuidSpec[], public noteInfo: INoteInfo, public hideLaunchAction?: boolean, public force?: boolean) { super(); } }

@handlerFor(InstallContents)
class InstallContentsHandler extends ClientQuery<InstallContents, void> {
  public async handle(request: InstallContents) {
    //this.raiseDownloadNotification(request.force ? 'Diagnosing' : 'Installing', null, request.noteInfo);
    //try {
    await this.client.installContents(<any>{
      gameId: request.gameId,
      contents: request.contents,
      name: request.noteInfo.text,
      href: request.noteInfo.href
    });
    //this.raiseDownloadNotification(request.force ? 'Diagnosed' : 'Installed', null, Object.assign({}, request.noteInfo, { command: this.createLaunchCommand(new LaunchContents(request.gameId, request.contents, request.noteInfo)) }));
    //} catch (err) { this.handleFailure(request.noteInfo, request, err); }
  }
}

export class UninstallContent extends VoidCommand { constructor(public gameId: string, public id: string, public noteInfo: INoteInfo) { super(); } }

@handlerFor(UninstallContent)
class UninstallContentHandler extends ClientQuery<UninstallContent, void> {
  public async handle(request: UninstallContent) {
    this.basketService.lastActiveItem = request.id;
    //this.raiseDownloadNotification('Uninstalling', name);
    //try {
    let req = Object.assign({}, { gameId: request.gameId, content: { id: request.id } }, {
      name: request.noteInfo.text,
      href: request.noteInfo.href
    })
    await this.client.uninstallContent(req);
    //this.raiseDownloadNotification('Uninstalled', name);
    //} catch (err) { this.handleFailure(request.noteInfo, request, err); }
    //this.context.eventBus.publish(new ContentDeleted(request.gameId, request.id)); // these states are already auto maanged by the complete state engine?
  }
}

export class Abort extends VoidCommand { constructor(public gameId: string, public id: string) { super(); } }

@handlerFor(Abort)
class AbortHandler extends DbClientQuery<Abort, void> {
  public async handle(request: Abort) {
    await this.client.abort(request.gameId);
    this.context.eventBus.publish(new Aborted(request.gameId, request.id));
  }
}
