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
  credit = 20; // TODO

  sizes = [
    { value: ServerSize.Small, title: ServerSize[ServerSize.Small] + " (Single core, 3.5GB)", cost: 5, baseSlots: 12, maxSlots: 12 },
    { value: ServerSize.Normal, title: ServerSize[ServerSize.Normal] + " (Dual core, 7GB)", cost: 10, baseSlots: 32, maxSlots: 64 },
    { value: ServerSize.Large, title: ServerSize[ServerSize.Large] + " (Quad core, 14GB)", cost: 20, baseSlots: 64, maxSlots: 256 },
    //{ value: ServerSize.VeryLarge, title: ServerSize[ServerSize.VeryLarge] + " (Octo core, 28GB) 4SU/hr", cost: 4 },
  ];
  locations = [
    { value: ServerLocation.WestEU, title: "West Europe" },
    { value: ServerLocation.WestUS, title: "West US" },
  ];
  sizeMap = this.sizes.toMap(x => x.value);
  addHc = uiCommand2("Add headless client", async () => this.addSecondary(), { cls: "ignore-close" });

  private _selectedSize;
  get selectedSize() { return this._selectedSize; }
  set selectedSize(value) { this._selectedSize = value; this.m.size = value.value; }

  get totalSlots() { return this.selectedSize.baseSlots + this.m.additionalSlots; }

  get m() { return this.server; };

  calcCost() {
    let cost = this.sizeMap.get(this.m.size).cost;
    this.m.secondaries.forEach(x => cost += this.sizeMap.get(x.size).cost);
    cost += this.m.additionalSlots;
    return cost;
  }

  calcHours() { return (this.credit / this.calcCost()) * 60 * 60; }


  async activate(model: ISetupTab) {
    super.activate(model);
    this._selectedSize = this.sizes.filter(x => x.value === this.m.size)[0];

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
        .merge(this.whenAny(x => x.m.additionalSlots))
        .merge(this.whenAny(x => x.credit))
        .merge(rxl.modified)
        .map(_ => this.calcHours())
        .subscribe(x => this.hours = x));
    });
  }

  addSecondary() { this.m.secondaries.push({ size: ServerSize.Normal }); }
  removeSecondary(s) { this.m.secondaries.removeEl(s); }
  generatePassword(length) { return this.tools.Password.generate(length); } // return Math.random().toString(36).slice(-8); }
  generateServerPassword() { this.m.password = this.generatePassword(6); }
  generateAdminPassword() { this.m.adminPassword = this.generatePassword(8); }

}
