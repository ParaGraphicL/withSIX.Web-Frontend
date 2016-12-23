import { ValidationGroup } from "aurelia-validation";
import { uiCommand2, ViewModel } from "../../framework";

export class ServerHosting extends ViewModel {
  static inCheck(arr) { return arr.indexOf("Other") > -1; }

  avatarUrl: string;

  gameModes = ["Co-op", "PVP", "DM", "KotH", "Other"];
  playerChoices = ["< 10", "10-30", "30-50", "> 50"];


  model = {
    agree: false,
    gameModes: [],
    otherGameModes: "",
    serverTypes: "",
    mods: "",
    modsHosted: "",
    community: {
      partOf: null,
      name: "",
      url: "",
      role: "",
    },
  };
  validation: ValidationGroup;

  signup = uiCommand2("Sign up", async () => {
    await this.validation.validate();
    alert("TODO");
  }, { cls: "ok" });

  get otherGameModeChecked() { return ServerHosting.inCheck(this.model.gameModes); }

  async activate() {
    if (this.isLoggedIn) {
      this.avatarUrl = this.userInfo.getAvatarUrl(48);
    }

    // since if/endIf doesnt seem to work...
    this.validation = this.baseValidator();
    try { await this.validation.validate(); } catch (err) { };

    this.subd(d => {
      this.observeEx(x => x.model.community.partOf)
        .skip(1)
        .concatMap(async x => {
          this.validation = x ? this.communityValidator(this.baseValidator()) : this.baseValidator()
          try { await this.validation.validate(); } catch (err) { };
        })
        .subscribe();
    });
  }

  baseValidator() {
    return this.validator.on(this)
      .ensure("model.gameModes")
      .isNotEmpty()
      .ensure("model.agree")
      .isNotEmpty()
      .passes(b => !!b, undefined)
      .ensure("model.community.partOf")
      .isNotEmpty()
      .passes(b => b != null, undefined);
  }

  communityValidator(validator: ValidationGroup) {
    return validator
      .ensure("model.community.name")
      .isNotEmpty()
      .ensure("model.community.url")
      .isNotEmpty()
      .ensure("model.community.role")
      .isNotEmpty();
  }
}