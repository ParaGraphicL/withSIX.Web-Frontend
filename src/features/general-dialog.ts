export class GeneralDialog {
  model; viewModel;
  
  activate(model) {
    this.model = model.model;
    this.viewModel = model.viewModel;
  }
}
