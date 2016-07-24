import {ViewModel, GitHub, Query, DbQuery, W6Context, handlerFor, UiContext, Post, ForumUrl} from '../../../../framework';
import { UpdateInterestingLinks } from '../mod-gallery';
import {inject} from 'aurelia-framework';

export class GitHubInfo extends ViewModel {
  model;
  repo: string;

  async activate(repo: string) {
    try {
      this.repo = repo;
      this.model = await new GetGitHubInfo(repo).handle(this.mediator);
      this.eventBus.publish(new UpdateInterestingLinks([new ForumUrl(`https://github.com/${repo}`)]));
    } catch (ex) { }
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
