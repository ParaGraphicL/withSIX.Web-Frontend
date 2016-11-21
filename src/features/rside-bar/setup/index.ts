import { ITabModel, ServerTab } from "../rside-bar";

interface ISetup {
  size: Size;
  secondaries: { size: Size }[];
  password: string;
  adminPassword: string;
  location: Location;
}

interface ISetupTab extends ITabModel<ISetup> { }

enum Size {
  Small,
  Normal,
  Large,
  VeryLarge
}

enum Location {
  WestEU,
  WestUS
}

export class Index extends ServerTab<ISetupTab> {
  hours: number;
  credit = 4; // TODO

  sizes = [
    { value: Size.Small, title: Size[Size.Small] + " (Single core, 3.5GB) 0.5SU/hr", cost: 0.5 },
    { value: Size.Normal, title: Size[Size.Normal] + " (Dual core, 7GB) 1SU/hr", cost: 1 },
    { value: Size.Large, title: Size[Size.Large] + " (Quad core, 14GB) 2SU/hr", cost: 2 },
    { value: Size.VeryLarge, title: Size[Size.VeryLarge] + " (Octo core, 28GB) 4SU/hr", cost: 4 },
  ];
  locations = [
    { value: Location.WestEU, title: "West Europe" },
    { value: Location.WestUS, title: "West US" },
  ];
  sizeMap = this.sizes.toMap(x => x.value);

  calcCost() {
    let cost = this.sizeMap.get(this.m.size).cost;
    this.m.secondaries.forEach(x => cost += this.sizeMap.get(x.size).cost);
    return cost;
  }

  calcHours() { return (this.credit / this.calcCost()) * 60 * 60; }


  activate(model: ISetupTab) {
    super.activate(model);

    this.model.data = Object.assign({
      adminPassword: "",
      location: Location.WestEU,
      password: "",
      secondaries: [],
      size: Size.Normal,
    }, this.model.data || {});

    this.validation = this.validation
      .ensure('m.name')
      .isNotEmpty()
      .hasMinLength(3)
      .hasMaxLength(150)
      .ensure('m.adminPassword')
      .isNotEmpty();

    this.subscriptions.subd(d => {
      const rxl = this.listFactory.getList(this.m.secondaries, ["size"]);
      d(this.whenAny(x => x.m.size)
        .merge(this.whenAny(x => x.credit))
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