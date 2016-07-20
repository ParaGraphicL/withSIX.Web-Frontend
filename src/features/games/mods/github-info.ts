import {ViewModel, GitHub, Query, DbQuery, W6Context, handlerFor, UiContext, Post} from '../../../framework';
import {inject} from 'aurelia-framework';

export class GitHubInfo extends ViewModel {
  model;
  repo: string;

  async activate(repo: string) {
    this.repo = repo;
    this.model = await new GetGitHubInfo(repo).handle(this.mediator);
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
