import { ITabModel, ServerTab, SharedValues } from "../rside-bar";
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

  sizes = SharedValues.sizes;
  locations = SharedValues.locations;
  addHc = uiCommand2("Add headless client", async () => this.addSecondary(), { cls: "ignore-close" });

  games = [`Arma 3 v1.66.139494`]
  selectedGame: string;
  private _selectedSize;

  get selectedSize() { return this._selectedSize; }
  set selectedSize(value) { this._selectedSize = value; this.setup.size = value.value; this.setup.additionalSlots = 0; }
  get totalSlots() { return this.selectedSize.baseSlots + this.setup.additionalSlots; }

  calcCost() {
    let cost = SharedValues.sizeMap.get(this.setup.size).cost;
    this.setup.secondaries.forEach(x => cost += SharedValues.sizeMap.get(x.size).cost);
    cost += this.setup.additionalSlots / 8 * 2;
    return cost;
  }

  calcHours() { return (this.credit / this.calcCost()) * 60 * 60; }

  async activate(model: ISetupTab) {
    super.activate(model);
    this._selectedSize = SharedValues.sizeMap.get(this.setup.size);

    this.validation = this.validation
      .ensure("server.name")
      .isNotEmpty()
      .hasMinLength(3)
      .hasMaxLength(150)
      .ensure("settings.adminPassword")
      .isNotEmpty();

    try { await this.validation.validate(); } catch (err) { };

    this.subscriptions.subd(d => {
      const rxl = this.listFactory.getList(this.setup.secondaries, ["size"]);
      d(this.whenAny(x => x.server.setup.size)
        .merge(this.whenAny(x => x.server.setup.additionalSlots))
        .merge(this.whenAny(x => x.credit))
        .merge(rxl.modified)
        .map(_ => this.calcHours())
        .subscribe(x => this.hours = x));
    });
  }

  async tryValidate() {
    const r = await super.tryValidate();
    if (!r) {
      // TODO: How to make this behavioral?
      if (!this.settings.adminPassword) { this.settings.adminPassword = "_"; setTimeout(() => this.settings.adminPassword = "", 10); }
      if (!this.server.name) { this.server.name = "_"; setTimeout(() => this.server.name = "", 10); }
    }
    return r;
  }

  addSecondary() { this.setup.secondaries.push({ size: ServerSize.Normal }); }
  removeSecondary(s) { this.setup.secondaries.removeEl(s); }
  generatePassword(length) { return this.tools.Password.generate(length); } // return Math.random().toString(36).slice(-8); }
  generateServerPassword() { this.settings.password = this.generatePassword(6); }
  generateAdminPassword() { this.settings.adminPassword = this.generatePassword(8); }
}
