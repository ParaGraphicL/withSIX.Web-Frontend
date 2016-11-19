import { ITabModel, ServerTab } from "../rside-bar";

interface ISetupTab extends ITabModel<{}> { }

enum Size {
  Small,
  Normal,
  Large,
  VeryLarge
}

export class Index extends ServerTab<ISetupTab> {
  sizes = [
    { value: Size.Small, title: Size[Size.Small] + " (Single core, 3.5GB)" },
    { value: Size.Normal, title: Size[Size.Normal] + " (Dual core, 7GB)" },
    { value: Size.Large, title: Size[Size.Large] + " (Quad core, 14GB)" },
    { value: Size.VeryLarge, title: Size[Size.VeryLarge] + " (Octo core, 28GB)" },
  ];

  activate(model: ISetupTab) {
    super.activate(model);
    this.model.data || (this.model.data = {
      size: Size.Normal
    });
  }

  get m() { return this.model.data; };
}