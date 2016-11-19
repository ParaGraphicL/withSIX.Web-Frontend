export class Servers {
  params;
  activate(params) {
    this.params = { modId: params.id };
  }
}