import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
import {ViewModel} from '../../../framework';

export class Index extends ViewModel {
	router: Router;

	configureRouter(config: RouterConfiguration, router: Router) {
		config.map([
			{ route: '',  name: 'home',      moduleId: 'features/profile/settings/home',      nav: true, title:'Home' }
		]);

		this.router = router;
	}
}
