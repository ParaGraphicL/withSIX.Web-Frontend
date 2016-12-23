import { ValidationGroup } from "aurelia-validation";
import { handlerFor, uiCommand2, ViewModel, VoidCommand } from "../../framework";
import { ServerHandler } from "../rside-bar/control/actions/base";

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
    await this.request(new Signup(this.model));
    alert("Thanks for signing up. Check your email. TODO");
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

  // doing this in here because VSCode's formatter otherwise removes the empty lines etc.
  betaText = `**Your feedback is crucial for us to get this awesome new feature ready for public release.**

As a tester, we want you to use our servers for your gaming sessions and report any issue you come across on our bug tracker. 

Since the requirements for communities can differ quite a bit, **share your expectations for our hosting service**. How can we make your gaming sessions even easier?

Write us your feedback on our forum and on Discord.

This is a beta release, so expect lots of changes as we continue improve on it. Even with the hours of testing we have already put into it, things might still break during usage. Since stability is the most important aspect of server hosting, we want you to immediately share any unexpected behavior with us.

AVAILABLE TEST Servers

For testing purposes, we will provide up to five servers for FREE testing. 

**Dedicated testes will be rewarded with free credits for their help upon the public release.**
`;
}

class Signup extends VoidCommand {
  constructor(public model) { super(); }
}

@handlerFor(Signup)
class SignupHandler extends ServerHandler<Signup, void> {
  handle(signup: Signup) {
    return this.client.signup.signup(signup.model);
  }
}