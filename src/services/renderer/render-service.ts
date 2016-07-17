import {Origin} from 'aurelia-metadata';
import {Container} from 'aurelia-dependency-injection';
import {CompositionEngine, ViewSlot} from 'aurelia-templating';
//import {DialogController} from './dialog-controller';
import {invokeLifecycle} from './lifecycle';
import {inject} from 'aurelia-framework';
import {DOM} from 'aurelia-pal';

interface ISettings { model?; view?; viewModel?; targetElement}

interface IController
  {viewModel; slot; view; settings: ISettings; controller}

@inject(Container, CompositionEngine)
export class RenderService {
  constructor(private container: Container, private compositionEngine: CompositionEngine) {  }
  open(settings?: ISettings): Promise<{dispose: () => void}> {
    let promise = new Promise((resolve, reject) => {
      let childContainer = this.container.createChild();
      //dialogController = new DialogController(childContainer.get(Renderer), settings, resolve, reject);
      //childContainer.registerInstance(DialogController, dialogController);
      let host = DOM.createElement('div');

      let instruction = {
        container: this.container,
        childContainer: childContainer,
        model: settings.model,
        view: settings.view,
        viewModel: settings.viewModel,
        viewSlot: new ViewSlot(host, true),
        host: host
      };

      let dialogController: IController = <any>{}
      dialogController.settings = settings;

      return _getViewModel(instruction, this.compositionEngine).then(returnedInstruction => {
        dialogController.viewModel = returnedInstruction.viewModel;
        dialogController.slot = returnedInstruction.viewSlot;

        return invokeLifecycle(dialogController.viewModel, 'canActivate', dialogController.settings.model).then(canActivate => {
          if (canActivate) {
            return this.compositionEngine.compose(returnedInstruction).then(controller => {
              // TODO: WHen parent element removed, call handleElementRemoved(dialogController)
              dialogController.controller = controller;
              dialogController.view = (<any>controller).view;

              return this.render(dialogController);
            });
          }
        });
      });
    });

    return promise;
  }

  handleElementRemoved(controller: IController) {
    invokeLifecycle(controller.viewModel, 'deactivate', undefined)
    .then(() => { controller.controller.unbind(); });
  }

  render(dialogController: IController) {
    let anchor = dialogController.slot.anchor;
    dialogController.settings.targetElement.appendChild(anchor);
    return { dispose: () => this.handleElementRemoved(dialogController) }
  }
}

function _getViewModel(instruction, compositionEngine) {
  if (typeof instruction.viewModel === 'function') {
    instruction.viewModel = Origin.get(instruction.viewModel).moduleId;
  }

  if (typeof instruction.viewModel === 'string') {
    return compositionEngine.ensureViewModel(instruction);
  }

  return Promise.resolve(instruction);
}
