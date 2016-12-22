import { ViewModel } from "../../framework";

export class ServerHosting extends ViewModel {
  avatarUrl: string;

  gameModes = ["Co-op", "PVP", "DM", "KotH", "Other"];

  model = {
    gameModes: [],
    otherGameModes: "",
    serverTypes: "",
    mods: "",
    modsHosted: "",
    community: {
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