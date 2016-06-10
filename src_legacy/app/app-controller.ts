module MyApp {
  export class MainAppController extends BaseController {
    static $name = "MainAppController";
    static $inject = ['$scope', 'usSpinnerService', 'logger', 'w6', '$location', '$q', '$timeout', '$rootScope', '$anchorScroll', 'aur.eventBus'];

    constructor($scope, private $spinner, logger, private w6: W6, private $location: ng.ILocationService, $q: ng.IQService, private $timeout: ng.ITimeoutService, private $rootScope: IRootScope, $anchorScroll, private eventBus: IEventBus) {
      super($scope, logger, $q);

      $rootScope.logout = () => w6.logout();
      $rootScope.openLoginDialog = evt => {
        if (evt) evt.preventDefault();
        w6.openLoginDialog(evt);
      };
      w6.openRegisterDialog = (event) => this.openRegisterDialog(event);
      w6.openSearch = (searchModel?) => this.openSearch(searchModel);

      $rootScope.ready = () => {
        Debug.log('ready');
        this.applyIfNeededOnScope(() => {
          if (this.first) {
            if (this.w6.renderAds)
              this.w6.ads.refreshAds();
            $anchorScroll();
          } else {
            this.first = true;
            if (this.w6.renderAds)
              this.w6.ads.check();
          }
          $rootScope.status = 'ready';
        }, $rootScope);
        window.prerenderReady = true;
      };
      $rootScope.startLoading = () => {
        $rootScope.status = 'loading';
        if (!$rootScope.$$phase) $scope.$apply();
      };

      $rootScope.initialLoad = true;

      // TODO: Somehow fix loading indication of the initial page load...
      var destroyList = [];
      destroyList.push($rootScope.$on('$routeChangeStart', this.routeStart));
      destroyList.push($rootScope.$on('loadingStatusActive', this.showSpinner));
      destroyList.push($rootScope.$on('loadingStatusInactive', this.hideSpinner));
      destroyList.push($rootScope.$on('$routeChangeError', this.routeError));
      destroyList.push($rootScope.$on('$routeChangeSuccess', this.routeSuccess));
      destroyList.push($rootScope.$on('$locationChangeSuccess', () => {
        this.setupDefaultTitle();
        $rootScope.setMicrodata(null);
        $rootScope.url.currentPage = $location.absUrl().split('#')[0];
      }));

      destroyList.push($rootScope.$on('$viewContentLoaded', () => {
        Debug.log('ANGULAR: view content loaded success');
      }));

      $scope.$on('$destroy', () => destroyList.forEach(x => x()));

      this.backwardsCompatibility();
    }
    openRegisterDialog(evt) {
      if (evt) evt.preventDefault();
      this.$scope.request(Components.Dialogs.OpenRegisterDialogQuery);
    }
    openSearch(searchModel) {
      if (!searchModel) searchModel = {};
      if (!searchModel.gameIDs) {
        if (this.w6.activeGame.id) {
          searchModel.gameIDs = Play.ContentIndexes.Mods.ModsHelper.getGameIds(this.w6.activeGame.id);
        }
      }
      this.$scope.request(Components.Dialogs.OpenSearchDialogQuery, { model: searchModel });
    }

    private routeStart = (scope, next, current) => {
      Debug.log('ANGULAR: route start');
      if (!next) return;
      var nextRoute = next.$$route;
      if (!nextRoute) return;
      var permission = nextRoute.permission;
      if (permission && !this.$scope.w6.userInfo.hasPermission(permission[0], permission[1]))
        this.$location.url('/errors/403');
      var role = nextRoute.role;
      if (role && !this.$scope.w6.userInfo.isInRoles(role)) {
        this.$scope.openLoginDialog(null);
      }
      this.$rootScope.startLoading();
    }

    private routeSuccess = () => {
      Debug.log('ANGULAR: route change success');
      if (!initialCompleted) {
        this.$timeout(() => {
          Debug.log('ANGULAR: initialRouteSuccess');
          initialCompleted = true;
        });
      }
    };
    private showSpinner = () => {
      this.$scope.loading = true;
      this.$spinner.spin('fetch-spinner');
    };
    private hideSpinner = () => {
      this.$scope.loading = false;
      this.$spinner.stop('fetch-spinner');
    };
    private routeError = (evt, current, previous, rejection) => {
      Debug.log("Error loading page", evt, current, previous, rejection);
      if (rejection.message)
        this.logger.error(rejection.message, "Failed loading page");
      else
        this.logger.error(rejection.data.message + "\n(" + rejection.status + ": " + rejection.statusText + ")");

    }; // These help us bring Angular awesomeness to outside the current scope of ng-app; something we'll improve on in the future...
    // Generally you should NOT manipulate DOM directly from within controllers. But directives / binding instead.
    backwardsCompatibility() {
      jQuery(document).ready(() => {
        this.w6.handleClient();
        this.legacy();
      });
    }

    legacy() {
      var self = this;

      // Toggle UserMenu - TODO Convert to Bootstrap
      $('body').on('click', '#btn-usermenu', function(e) {
        // prevent normal behvavior
        e.preventDefault();
        // usermenu Int
        self.w6.usermenu.init();

        // blur button
        $(this).blur();
      });

      this.$rootScope.handleDownloads();

      var w = $(window);
      var wasWidth = w.width();
      var resizeTO = null;
      w.resize(() => {
        if (resizeTO) clearTimeout(resizeTO);
        resizeTO = setTimeout(() => {
          var width = w.width();
          if (!wasWidth || wasWidth != width) {
            w.trigger('resizeEnd', [wasWidth, width]);
            wasWidth = width;
          }
        }, 500);
      });

      // Init Forms
      self.w6.forms.init();

      $('body').on('click', '.share-bbcode', function(e) {
        // prevent default behavior
        e.preventDefault();
        window.prompt("Copy to clipboard: Ctrl+C, Enter", $(this).attr("data-bbcode"));
      });

      // Scroll to top button
      $('body').on('click', '#btn-scroll-to-top', e => {
        // prevent default behavior
        e.preventDefault();

        // Scroll to top
        self.w6.scrollTo(0, 600);
      });

      // Make fancy scroll Annimation to all Anchor internal links
      $('body').on('click', 'a[href^="#"]', function(e) {
        e.preventDefault();
        // Removeing '#' form href
        var anchorname = $(this).attr('href').substr(1);
        if (anchorname != '')
          self.w6.scrollToAnchor(anchorname);
      });


      // Textarea max length
      if ($('.wmd-input[maxlength]').length > 0) {
        var elements = $('.wmd-input[maxlength]');


        // Key up events
        elements.on('keyup', function(e) {
          var maxChars = parseInt($(this).attr('maxlength'));
          var curChars = $(this).val().length;
          var charsLeft = maxChars - curChars;

          if (charsLeft >= 0) {
            $(this).parent().find('span.charsleft em').empty().append(charsLeft.toString());
          } else {
            e.preventDefault();
          }
        });


        // Handleing pahge refresh, reset the textarea to max chars
        elements.each(function(i, element) {
          var maxChars = parseInt($(this).attr('maxlength'));
          var curChars = $(this).val().length;
          var charsLeft = maxChars - curChars;

          $(this).parent().find('span.charsleft em').empty().append(charsLeft.toString());

        });

      }

      // Pop Out by colorbox
      if ($(".popgroup").length > 0) $(".popgroup").colorbox({ rel: 'group2', transition: "fade" });

      $('a[rel=external]').attr('target', '_blank');

      if (self.w6.enableAds)
        w.on('resizeEnd', (e, previous, current) => self.w6.ads.processAdSlots(previous, current));

    }

    private first;
  }

  export class LoadingController extends BaseController {
    static $name = 'LoadingController';
    static $inject = ['$scope', 'logger', '$q', '$timeout', '$rootScope'];

    constructor($scope, logger, $q, $timeout, $rootScope) {
      super($scope, logger, $q);
      $rootScope.loadingStatus.increment();
      $scope.$on('$destroy', () => $timeout(() => $rootScope.loadingStatus.decrement(), 500));
    }
  }

  registerController(LoadingController);

  export class AureliaPageController extends BaseController {
    static $name = 'AureliaPageController';
    static $inject = ['$scope', 'logger', '$q'];

    constructor(public $scope: IBaseScope, public logger, public $q) {
      super($scope, logger, $q);
      Debug.log('aurelia page controller init', initialCompleted);
    }
  }

  registerController(AureliaPageController);

  export class LoadingFailedController extends Tk.Controller {
    static $name = 'LoadingFailedController';
    static $inject = ['$scope', 'logger', 'ForwardService', 'error'];

    constructor($scope, logger, private forwardService: Components.ForwardService, error) {
      super($scope);
      var errorMsg = window.w6Cheat.api.errorMsg(error);

      $scope.reason = (errorMsg[1] != null ? (errorMsg[1] + ": ") : "") + errorMsg[0];
      $scope.title = errorMsg.length >= 3 ? errorMsg[2] : "Oops! Loading failed :(";

      if (error instanceof Tk.RequireSslException) {
        forwardService.switchToSsl();
      } else if (error instanceof Tk.RequireNonSslException) {
        forwardService.switchToNonSsl();
      }
    }
  }

  registerController(MainAppController);
  registerController(LoadingFailedController);

  export interface IBreezeErrorReason extends IBreezeHttpResponse<IHttpResponse<IHttpResponseException>> {
  }

  export interface IBreezeHttpResponse<TResponse> {
    httpResponse: TResponse;
    entityManager: breeze.EntityManager;
    query: breeze.EntityQuery;
    status: number;
    message: string;
  }

  export interface IHttpResponse<TData> {
    data: TData;
    status: number;
    statusText: string;
  }

  export interface IHttpResponseException {
    $id: string;
    $type: string;
    ExceptionMessage: string;
    ExceptionType: string;
    Message: string;
    StackTrace?: string;
  }
}
