import { ITabModel, ServerTab } from "../rside-bar";

interface ISetup {
  size: Size;
  secondaries: { size: Size }[];
  credit: number;
  password: string;
  adminPassword: string;
}

interface ISetupTab extends ITabModel<ISetup> { }

enum Size {
  Small,
  Normal,
  Large,
  VeryLarge
}

export class Index extends ServerTab<ISetupTab> {
  sizes = [
    { value: Size.Small, title: Size[Size.Small] + " (Single core, 3.5GB) 0.5SU/hr", cost: 0.5 },
    { value: Size.Normal, title: Size[Size.Normal] + " (Dual core, 7GB) 1SU/hr", cost: 1 },
    { value: Size.Large, title: Size[Size.Large] + " (Quad core, 14GB) 2SU/hr", cost: 2 },
    { value: Size.VeryLarge, title: Size[Size.VeryLarge] + " (Octo core, 28GB) 4SU/hr", cost: 4 },
  ];
  sizeMap = this.sizes.toMap(x => x.value);

  calcCost() {
    let cost = this.sizeMap.get(this.m.size).cost;
    this.m.secondaries.forEach(x => cost += this.sizeMap.get(x.size).cost);
    return cost;
  }

  calcHours() { return (this.m.credit / this.calcCost()) * 60 * 60; }

  hours: number;

  activate(model: ISetupTab) {
    super.activate(model);
    this.model.data || (this.model.data = {
      credit: 4,
      size: Size.Normal,
      secondaries: []
    });
    this.subscriptions.subd(d => {
      const rxl = this.listFactory.getList(this.m.secondaries, ["size"]);
      d(this.whenAny(x => x.m.size)
        .merge(this.whenAny(x => x.m.credit))
        .merge(rxl.modified)
        .map(_ => this.calcHours())
        .subscribe(x => this.hours = x));
    });
  }

  addSecondary() { this.m.secondaries.push({ size: Size.Normal }); }
  removeSecondary(s) { this.m.secondaries.removeEl(s); }
  generatePassword(length) { return this.tools.Password.generate(length); } // return Math.random().toString(36).slice(-8); }
  generateServerPassword() { this.m.password = this.generatePassword(6); }
  generateAdminPassword() { this.m.adminPassword = this.generatePassword(8); }

  get m() { return this.model.data; };
}