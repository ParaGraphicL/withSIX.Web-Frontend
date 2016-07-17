export class GeneralDialog {
  model;
  activate(model) {
    this.model = model.model;
    this.viewModel = model.viewModel;
  }
}
