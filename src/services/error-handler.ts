import {inject} from 'aurelia-framework';
import {Validation, ValidationResult} from 'aurelia-validation';
import {Mediator, IMediator, IRequest, IRequestHandler} from './mediator';
import {GlobalErrorHandler} from './legacy/logger';
import {Tools} from './tools';
import {W6} from './withSIX';
import { Toastr } from './toastr';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import { ClientConnectionFailed, OperationCanceledError } from 'withsix-sync-api';

@inject(W6, Toastr, Router, EventAggregator)
export class ClientMissingHandler {
  constructor(private w6: W6, private toastr: Toastr, private router: Router, private eventBus: EventAggregator) { }

  get hasActiveGame() { return this.w6.activeGame.id != null };
  get isClientConnected() { return this.w6.miniClient.isConnected; }

  async requireAccount() { this.toastr.warning("Requires account", "Please login").then(x => this.w6.openLoginDialog(null)) }

  async handleClientOrGameMissing() {
    if (!this.hasActiveGame) await this.handleActiveGameMissing();
    else if (!this.isClientConnected) await this.handleClientMissing();
  }

  async handleClientMissing() {
    if (this.w6.settings.hasSync) {
      this.addClientIframe();
      await this.handleMessage("Trying to start the client, or click here to download the Sync client");
    } else await this.handleMessage("Click here to download the Sync client");
  }

  async handleActiveGameMissing() {
    this.toastr.warning("Please select a game", "Requires an active game")
      .then(x => x ? this.openPlayTab() : null);
    this.openPlayTab();
  }

  openPlayTab = () => this.eventBus.publish(new SwitchSideBarTab('play'));

  private async handleMessage(message: string) {
    if (await this.toastr.warning(message, "Requires Sync client"))
      this.router.navigate("/download");
  }

  addClientIframe() {
    if (window.___prerender___) return;
    var i = document.createElement('iframe');
    i.style.display = 'none';
    i.onload = function () { i.parentNode.removeChild(i); };
    i.src = 'syncws://?launch=1';
    document.body.appendChild(i);
  }
}

// TODO: UserError esque (Or check RXUI7) Retry/Cancel support

@inject(Toastr, ClientMissingHandler, W6, GlobalErrorHandler)
export class ErrorHandler {
  constructor(private toastr: Toastr, private clientMissingHandler: ClientMissingHandler, private w6: W6, private eh: GlobalErrorHandler) {}

  handleError = (fail: Error, action?: string) => {
    let failStr = fail.toString();
    if (fail instanceof ValidationResult) this.handleValidationError(fail, action);
    else if (fail instanceof ClientConnectionFailed || failStr === 'Error: Error during negotiation request.') this.handleClientMissing(fail, action);
    else if (fail instanceof OperationCanceledError || failStr === 'Error: The user cancelled the operation' || failStr === 'Error: Operation aborted' || failStr === 'Error: The operation was aborted') {
    } else {
      this.handleGeneralError(fail, action);
      this.eh.handleUseCaseError(fail, action);
    }
  }

  // TODO: Just disable the save button until validated?
  handleValidationError = (err, action) =>
    this.toastr.warning("Please fix the indicated fields", "Validation failed");

  handleClientMissing = (err, action) => this.clientMissingHandler.handleClientMissing();

  handleGeneralError(err, action) {
    // TODO: Perhaps only show toast if we specified action?
    var msg = this.w6.api.errorMsg(err);
    Tools.Debug.error(msg);
    return this.toastr.error(msg[0], (action || "Action") + ": " + msg[1]);
  }
}

export class SwitchSideBarTab {
  constructor(public name: string) { }
}
