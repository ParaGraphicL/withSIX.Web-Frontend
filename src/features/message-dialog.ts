import {Dialog} from '../framework';
import {DialogService, DialogController} from 'aurelia-dialog';
import {inject} from 'aurelia-framework';

interface Message { title: string, message: string, buttons: string[] }
@inject(DialogController)
export class MessageDialog {
  constructor(private controller: DialogController) { }
  model: Message;
  activate(model: Message) { this.model = model; }
  static YesNo = ['Yes', 'No'];
  static YesNoCancel = ['Yes', 'No', 'Cancel'];
  static Ok = ['OK'];
  handle = (response) => (response == 'ok' || response == 'yes') ? this.controller.ok(response) : this.controller.cancel(response);
}

Dialog.workaround(MessageDialog, "features/message-dialog", "MessageDialog");
