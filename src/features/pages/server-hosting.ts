import { ViewModel } from "../../framework";

export class ServerHosting extends ViewModel {
  avatarUrl: string;

  gameModes = ["Co-op", "PVP", "DM", "KotH", "Other"];
  playerChoices = ["< 10", "10-30", "30-50", "> 50"];

  model = {
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
    }
  }

  activate() {
    if (this.isLoggedIn) {
      this.avatarUrl = this.userInfo.getAvatarUrl(48);
    }
  }
}