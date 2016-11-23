import { ITabModel, ServerTab } from "../rside-bar";
import { uiCommand2, ServerSize, ServerLocation } from "../../../framework";

interface ISetup {
  size: ServerSize;
  secondaries: { size: ServerSize }[];
  password: string;
  adminPassword: string;
  location: ServerLocation;
}

interface ISetupTab extends ITabModel<ISetup> { }

export class Index extends ServerTab<ISetupTab> {
  hours: number;
  credit = 4; // TODO

  sizes = [
    { value: ServerSize.Small, title: ServerSize[ServerSize.Small] + " (Single core, 3.5GB) 0.5SU/hr", cost: 0.5 },
    { value: ServerSize.Normal, title: ServerSize[ServerSize.Normal] + " (Dual core, 7GB) 1SU/hr", cost: 1 },
    { value: ServerSize.Large, title: ServerSize[ServerSize.Large] + " (Quad core, 14GB) 2SU/hr", cost: 2 },
    { value: ServerSize.VeryLarge, title: ServerSize[ServerSize.VeryLarge] + " (Octo core, 28GB) 4SU/hr", cost: 4 },
  ];
  locations = [
    { value: ServerLocation.WestEU, title: "West Europe" },
    { value: ServerLocation.WestUS, title: "West US" },
  ];
  sizeMap = this.sizes.toMap(x => x.value);

  calcCost() {
    let cost = this.sizeMap.get(this.m.size).cost;
    this.m.secondaries.forEach(x => cost += this.sizeMap.get(x.size).cost);
    return cost;
  }

  calcHours() { return (this.credit / this.calcCost()) * 60 * 60; }


  async activate(model: ISetupTab) {
    super.activate(model);

    this.validation = this.validation
      .ensure('m.name')
      .isNotEmpty()
      .hasMinLength(3)
      .hasMaxLength(150)
      .ensure('m.adminPassword')
      .isNotEmpty();

    try { await this.validation.validate(); } catch (err) { };

    this.subscriptions.subd(d => {
      const rxl = this.listFactory.getList(this.m.secondaries, ["size"]);
      d(this.whenAny(x => x.m.size)
        .merge(this.whenAny(x => x.credit))
        .merge(rxl.modified)
        .map(_ => this.calcHours())
        .subscribe(x => this.hours = x));
    });
  }

  addHc = uiCommand2("Add headless client", async () => this.addSecondary());
  addSecondary() { this.m.secondaries.push({ size: ServerSize.Normal }); }
  removeSecondary(s) { this.m.secondaries.removeEl(s); }
  generatePassword(length) { return this.tools.Password.generate(length); } // return Math.random().toString(36).slice(-8); }
  generateServerPassword() { this.m.password = this.generatePassword(6); }
  generateAdminPassword() { this.m.adminPassword = this.generatePassword(8); }

  get m() { return this.server; };
}