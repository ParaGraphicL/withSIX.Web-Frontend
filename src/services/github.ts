import { W6Context } from './w6context';
import { inject } from 'aurelia-framework';


@inject(W6Context)
export class GitHub {
  constructor(private ctx: W6Context) { }
  getReleases(repo: string) {
    let url = `https://api.github.com/repos/${repo}/releases`
    return this.ctx.getCustom(url);
  }
}
