import {ViewModel} from '../../framework';

export class ExternalLink extends ViewModel {
  model: { url: string }
  activate(params) {
    if (params.url.startsWith('http://withsix.com/')
      || params.url.startsWith('https://withsix.com/')
      || params.url.startsWith('http://community.withsix.com/')
      || params.url.startsWith('https://community.withsix.com/')
      || params.url.startsWith('https://auth.withsix.com/'))
      this.router.navigate(params.url);
    else
      this.model = {
        url: params.url
      }
  }
}
