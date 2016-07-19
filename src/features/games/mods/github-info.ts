import {ViewModel, GitHub, Query, DbQuery, W6Context, handlerFor, UiContext, Post} from '../../../framework';
import {inject} from 'aurelia-framework';

export class GitHubInfo extends ViewModel {
  //model: { id: string; name: string; steamId?: string}
  model;
  gitUrl: string;

  async activate(gitUrl: string) {
    this.gitUrl = gitUrl;
    this.model = await new GetGitHubInfo(gitUrl).handle(this.mediator);
  }
}

interface GitInfo { releases: any[] }

class GetGitHubInfo extends Query<GitInfo> {
  constructor(public repo: string) { super() }
}

@handlerFor(GetGitHubInfo)
@inject(GitHub, W6Context)
class GetGitHubInfoHandler extends DbQuery<GetGitHubInfo, GitInfo> {
  constructor(private gh: GitHub, ctx) { super(ctx) }
  async handle(request: GetGitHubInfo) {
    return {
      releases: await this.gh.getReleases(request.repo)
    }
  }
}
