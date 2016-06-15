﻿module MyApp.Connect.Profile {
  export interface IProfileScope extends IBaseScopeT<any> {
    addFriend;
    removeFriend;
  }

  class ProfileController extends BaseQueryController<any> {
    static $name = "ProfileController";

    constructor(public $scope: IProfileScope, public logger, $q, model) {
      super($scope, logger, $q, model);
      var menuItems = [
        { header: "Content", segment: "content", icon: "fa fa-th", isDefault: true },
        { header: "Blogposts", segment: "blog", icon: "fa fa-book" },
        { header: "Friends", segment: "friends", icon: "fa fa-group" }
      ];

      if (model.isFriend)
        menuItems.push({ header: "Send message to", segment: "messages", icon: "fa fa-comments" });

      $scope.menuItems = this.getMenuItems(menuItems, "profile");
      // TODO: Switch menuitems based on isFriend dynamically changing
      $scope.addFriend = () => this.processCommand($scope.request(AddAsFriendCommand, { userSlug: model.slug })
        .then((data) => model.isFriend = true));
      $scope.removeFriend = () => this.processCommand($scope.request(RemoveAsFriendCommand, { userSlug: model.slug })
        .then((data) => model.isFriend = false));
    }
  }

  class ProfileBlogController extends BaseQueryController<any> {
    static $name = "ProfileBlogController";
  }

  class ProfileMessagesController extends BaseQueryController<any> {
    static $name = "ProfileMessagesController";

    constructor(public $scope, public logger, $q, model) {
      super($scope, logger, $q, model);

      $scope.inputModel = { message: "" };
      $scope.sendMessage = form =>
        this.processCommand(this.$scope.request(Me.CreatePrivateMessageCommand, { userSlug: this.$scope.model.partner.slug, data: this.$scope.inputModel })
          .then((data) => {
            this.$scope.model.messages.push({ message: this.$scope.inputModel.body, receivedAt: new Date(), isAuthor: true });
            this.$scope.inputModel.body = "";
            form.$setPristine();
          }));
    }
  }

  class ProfileFriendsController extends BaseQueryController<any> {
    static $name = "ProfileFriendsController";
  }

  class ProfileContentController extends BaseController {
    static $name = "ProfileContentController";

    constructor(public $scope: IBaseScope, public logger, $q) {
      super($scope, logger, $q);
      var menuItems = [
        { header: "Collections", segment: "collections", icon: "icon withSIX-icon-Nav-Collection", isDefault: true },
        { header: "Mods", segment: "mods", icon: "icon withSIX-icon-Nav-Mod" },
        { header: "Missions", segment: "missions", icon: "icon withSIX-icon-Nav-Mission" }
      ];

      $scope.menuItems = this.getMenuItems(menuItems, "profile.content");
    }
  }

  registerController(ProfileController);
  registerController(ProfileBlogController);
  registerController(ProfileFriendsController);
  registerController(ProfileMessagesController);
  registerController(ProfileContentController);
}
