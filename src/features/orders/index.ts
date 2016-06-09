import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
export class OrdersModule {
  configureRouter(config: RouterConfiguration, router: Router, mount: string, routeMount: string) {
    mount = mount + 'orders/';
    config.map([
      { route: `${routeMount}:orderId/checkout`, name: 'order_checkout', moduleId: `${mount}checkout`, nav: false, auth: true},
      { route: `${routeMount}:orderId/success`, name: 'order_success', moduleId: `${mount}success`, nav: false, auth: true},
      { route: `${routeMount}:orderId/failure`, name: 'order_failure', moduleId: `${mount}failure`, nav: false, auth: true},
      { route: `${routeMount}:orderId/resend`, name: 'order_resend', moduleId: `${mount}resend`, nav: false, auth: true},
      { route: `${routeMount}:orderId/confirmpayment`, name: 'order_confirmpayment', moduleId: `${mount}confirmpayment`, nav: false, auth: true},
      { route: `${routeMount}:orderId/confirmrecurring`, name: 'order_confirmrecurring', moduleId: `${mount}confirmrecurring`, nav: false, auth: true}
    ])
  }
}
