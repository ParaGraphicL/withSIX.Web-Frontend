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

  private _selectedSize;
  get selectedSize() { return this._selectedSize; }
  set selectedSize(value) { this._selectedSize = value; this.server.size = value.value; this.server.additionalSlots = 0; }
  get totalSlots() { return this.selectedSize.baseSlots + this.server.additionalSlots; }

  calcCost() {
    let cost = SharedValues.sizeMap.get(this.server.size).cost;
    this.server.secondaries.forEach(x => cost += SharedValues.sizeMap.get(x.size).cost);
    cost += this.server.additionalSlots / 8 * 2;
    return cost;
  }

  calcHours() { return (this.credit / this.calcCost()) * 60 * 60; }

  async activate(model: ISetupTab) {
    super.activate(model);
    this._selectedSize = SharedValues.sizeMap.get(this.server.size);

    this.validation = this.validation
      .ensure("server.name")
      .isNotEmpty()
      .hasMinLength(3)
      .hasMaxLength(150)
      .ensure("server.adminPassword")
      .isNotEmpty();

    try { await this.validation.validate(); } catch (err) { };

    this.subscriptions.subd(d => {
      const rxl = this.listFactory.getList(this.server.secondaries, ["size"]);
      d(this.whenAny(x => x.server.size)
        .merge(this.whenAny(x => x.server.additionalSlots))
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
      if (!this.server.adminPassword) { this.server.adminPassword = "_"; setTimeout(() => this.server.adminPassword = "", 10); }
      if (!this.server.name) { this.server.name = "_"; setTimeout(() => this.server.name = "", 10); }
    }
    return r;
  }

  addSecondary() { this.server.secondaries.push({ size: ServerSize.Normal }); }
  removeSecondary(s) { this.server.secondaries.removeEl(s); }
  generatePassword(length) { return this.tools.Password.generate(length); } // return Math.random().toString(36).slice(-8); }
  generateServerPassword() { this.server.password = this.generatePassword(6); }
  generateAdminPassword() { this.server.adminPassword = this.generatePassword(8); }
}
