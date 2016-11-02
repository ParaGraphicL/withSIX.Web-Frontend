import {W6, W6Urls} from "../withSIX";
import { inject } from "aurelia-framework";
import { HtmlFetcher } from "./parser";

@inject(HtmlFetcher)
export class Listforge {
  constructor(private fetcher: HtmlFetcher) { }

  async getPost(url: string, baseUrl = url): Promise<Post> {
    const p = await this.fetcher.fetch(url, baseUrl);
    /*
            var descHeader = desc.FirstOrDefault(x => x.QuerySelector("h2")?.GetText() == "Description");
            var descContent = descHeader?.NextElementSibling.QuerySelector("div.span12").QuerySelector("div");
            if (text.Contains("getTeamspeakState("))
                await GetTeamspeakDetails(c, parser).ConfigureAwait(false);
            var uri = new Uri(baseUri, "ajax.php");
            var fd = {
                "action": "getTeamspeakState",
                "server_id": c.Publisher.PublisherId
            };
    
            let r = await fetcher.postFd(uri, fd) 
            var jO = r.FromJson<ServersResponse>();
            var dom2 = parser.Parse(jO.Results);
            var addr = dom2?.QuerySelector("a")?.GetAttribute("href");
    */
    let bodyEl = p.find(doc => doc.find("body").first()).first();
    let body = p.toHtml(bodyEl);
    let images = p.extractImages(bodyEl);
    let interestingLinks = p.extractInterestingLinks(bodyEl);
    return {
      body, userName: null, dateTime: null, title: null, images, interestingLinks,
    };
  }
}

interface Post {
  body: string; userName: string; dateTime: string; title: string; images: string[]; interestingLinks?: {};
}
