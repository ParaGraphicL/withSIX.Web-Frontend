import {Tools} from '../tools';
import {W6} from '../withSIX';
import {LegacyMediator} from '../mediator';

export module Tk {
  export class Base {
    get tools() { return Tools }
  }

  export class Module extends Base {
    static $name;
    app: ng.IModule;

    constructor(name: string, modules: Array<string>) {
      super();
      this.tools.Debug.log('module init: ' + this.constructor.$name);
      this.app = angular.module(name, modules);
    }

    public registerAllFilters(filters) {
      for (var i in filters) {
        var d = filters[i];
        this.app.filter(d.$name, d.factory);
      }
    }

    public registerAllFactories(factories) {
      for (var i in factories) {
        var d = factories[i];
        this.app.factory(d.$name, d.factory);
      }
    }

    public registerAllDirectives(directives) {
      for (var i in directives) {
        var d = directives[i];
        this.app.directive(d.$name, d.factory);
      }
    }

    public registerAllControllers(controllers) {
      for (var i in controllers) {
        var c = controllers[i];
        this.registerController(c);
      }
    }

    public registerController(c) {
      this.app.controller(c.$name, c);
    }

    public registerCommand(c) {
      this.commands.push(c);
    }

    public registerAllServices(services) {
      for (var i in services) {
        var s = services[i];
        this.app.service(s.$name, s);
      }
    }

    commands = [];
  }

  export class Service extends Base {
    static $name;

    constructor() {
      super();
      this.tools.Debug.log('service init: ' + this.constructor.$name);
    }
  }

  export interface IScope extends ng.IScope {
    vm;
  }

  export class Controller extends Base {
    static $name;
    static $inject = ['$scope'];

    constructor(scope: IScope) {
      super();
      scope.vm = this;
      this.tools.Debug.log('controller init: ' + this.constructor.$name);
    }
  }

  export class Directive extends Base {
    static $name;

    constructor() {
      super();
      this.tools.Debug.log('directive init: ' + this.constructor.$name);
    }
  }

  export class CommangularBase extends Base {
    public onError = (error) => {
      this.tools.Debug.log("CommandError", error);
    }
  }

  export class QueryBase extends CommangularBase {
    static $type = 'Query'
  }

  export class CommandBase extends CommangularBase {
    static $type = 'Command'
  }

  export class RoutingHandler extends Base {
    static $name = 'sxRouteProvider';
    static $inject = ['$routeProvider', '$routeSegmentProvider'];

    constructor(private $routeProvider: ng.route.IRouteProvider, private $routeSegmentProvider, private prefix?: string) { super() }

    private legacy: boolean;

    joinPrefix(path) {
      if (!this.prefix) return path;
      if (path == "/") return this.prefix;
      return this.prefix + path;
    }

    public when = (path, segmentName) => {
      path = this.joinPrefix(path);
      if (typeof (segmentName) === "string") {
        this.legacy = false;
        // segmentRoute must be set first so it gets overriden by route..
        this.segmentRoute = this.$routeSegmentProvider.when(path, segmentName);
        this.route = this.$routeProvider.when(path, this.whenOpts({ segment: segmentName }));
      } else {
        this.tools.Debug.log('WARN: legacy, deprecated syntax used for: ' + path, segmentName);
        this.route = this.$routeProvider.when(path, this.whenOpts(segmentName));
        //this.segmentRoute = undefined;
        this.legacy = true;
      }
      return this;
    };
    public within = () => {
      if (!this.segmentRoute) throw "Not within segment yet";

      // Must make new one because otherwise we get all kinds of nasty problems
      // TODO: really need to find out how to make better...
      var router = new RoutingHandler(this.$routeProvider, this.$routeSegmentProvider);
      router.segmentRoute = this.segmentRoute.within();
      return router;
    };
    public segment = (segmentPath, segmentOptions) => {
      if (this.legacy) throw "Cannot access segment on legacy routeProvider";
      this.segmentRoute.segment(segmentPath, this.segmentOpts(segmentOptions));
      return this;
    };

    p = null;

    public setupP = () => ['$interval', '$q', ($interval, $q) => {
      if (!this.p) {
        var p = $q.defer();
        var i = $interval(() => {
          if (W6.instance.aureliaReady) {
            $interval.cancel(i);
            p.resolve();
          }
        }, 100);
        this.p = p.promise;
      }
      return this.p;
    }];


    public setupQuery = (query, defaults?) => {
      if (defaults) defaults = angular.copy(defaults);
      if (!defaults) defaults = {};
      return { model: this.setupQueryPart(query, defaults) };
    }
    public setupQueryPart = (query, defaults?) => ['aur.legacyMediator', '$route', '$interval', '$q', (m: LegacyMediator, $route, $interval, $q) => {
      const params = Object.assign({}, defaults, $route.current ? $route.current.params : {});
      if (!this.p) {
        (<any>this.setupP())[2]($interval, $q);
      }
      return this.p.then(x => m.legacyRequest(query.$name, params)).catch(x => {
        if (x && x.toString().includes('Unknown provider: ')) return Promise.reject(new Error("Route parameter missing"));
        return Promise.reject(x);
      });
    }]

    public defaultRefreshFunction = type => {
      var refreshFunc = service => service.getType(type);
      refreshFunc['$inject'] = ['refreshService'];
      return refreshFunc;
    }
    private defaultUntilResolved = { templateUrl: '/src_legacy/app/components/loading.html', controller: "LoadingController" };

    private defaultResolvedFailed = {
      templateUrl: '/src_legacy/app/components/loading-failed.html',
      controller: 'LoadingFailedController'
    };

    private segmentOpts = overrideOpts => Object.assign({
      untilResolved: this.defaultUntilResolved,
      resolveFailed: this.defaultResolvedFailed,
      controllerAs: 'vm',
      resolve: {
        model: this.setupP()
      }
    }, overrideOpts);

    private whenOpts = overrideOpts => Object.assign({
      reloadOnSearch: false,
      caseInsensitiveMatch: true
    }, overrideOpts);

    private segmentRoute;
    private route;
  }

  export class BeforeInterceptor extends Base {
    static $inject = ['processor'];

    constructor(private processor) { super() }

    public execute() { this.tools.Debug.log("Dispatching command", this.processor); }
  }

  export class AfterInterceptor extends Base {
    static $inject = ['processor'];

    constructor(private processor) { super() }

    public execute() { this.tools.Debug.log("Dispatched command finished", this.processor); }
  }

  export class AfterThrowingInterceptor extends Base {
    static $inject = ['processor', 'lastError'];

    constructor(private processor, private lastError) { super() }

    public execute() { this.tools.Debug.log("Dispatched command threw error", this.lastError); }
  }
}
