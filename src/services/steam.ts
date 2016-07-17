export enum Publisher {
  // Publishing systems
  Steam,
  Armaholic,
  GitHub,

  // Forums
  BiForums = 10000,
  GtaForums,
  ArmaholicForum
}

import {W6} from './withSIX';
import {HttpClient as FetchClient} from 'aurelia-fetch-client';
import {inject} from 'aurelia-framework';

//import {HttpClient as HttpClient} from 'aurelia-http-client';

import {BBTag} from './bbcode/bbTag';
import {BBCodeParser} from './bbcode/bbCodeParser';

var bbTags = [BBTag.createSimpleTag("h1"), BBTag.createSimpleTag("h2"), BBTag.createSimpleTag("h3")];
// url is broken atm, or at least doesnt seem to support [url=...]
var parser = new BBCodeParser(bbTags.concat(BBCodeParser.defaultTags().filter(x => x.tagName !== 'url')));

interface IW6Mod {
  name: string; packageName: string; id: string; modversion: string; publishers: { id: string, type: Publisher }[]
}

@inject(FetchClient, W6)
export class SteamService {
  constructor(private http: FetchClient, private w6: W6) { }

  get parser() { return parser }

  async getW6Mods() {
    let addr = "http://proxy.withsix.net/api2/api/v2/mods.json";
    let r = await this.http.fetch(addr, { method: 'GET' });
    if (!r.ok) throw r;
    let mods = this.w6.convertToClient<IW6Mod[]>(await r.json());
    let steamMods = mods.filter(x => x.publishers && x.publishers.some(x => x.type == Publisher.Steam));
    let data = steamMods.map(x => {
      return {
        id: x.id,
        name: x.name,
        steamId: x.publishers.filter(x => x.type == Publisher.Steam)[0].id,
        steamInfo: null,
        packageName: x.packageName,
        version: x.modversion
      }
    }).toMap(x => x.id);

    //    let steamInfo = await this.getSteamInfo(...data.map(x => x.steamId));
    //steamInfo.forEach((x, i) => data[i].steamInfo = x);
    return data;
  }

  async getSteamInfo(...contentIds: (string | number)[]) {
    let filesUrl = "http://proxy.withsix.net/api/ISteamRemoteStorage/GetPublishedFileDetails/v1/";

    let q = {
      itemcount: contentIds.length,
      format: 'json'
    }

    let publishedfileids = contentIds;


    let str = parseJsonAsQueryString(q);
    str += "&" + publishedfileids.map((x, i) => `publishedfileids[${i}]=${x}`).join("&")


    let r = await this.http.fetch(filesUrl, { method: 'POST', body: str, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (!r.ok) throw r;
    let info = await r.json();
    return info.response.publishedfiledetails;
  }

  async getSteamFiles(gameId: number) {
    let apiUrl = "http://proxy.withsix.net/api/IPublishedFileService/QueryFiles/v1/";

    let q = {
      appid: gameId
    }

    var form_data = new FormData();

    for (var key in q) {
      form_data.append(key, q[key]);
    }


    return await this.http.fetch(apiUrl, { method: 'POST', body: form_data });
  }
}

const parseJsonAsQueryString = function(obj, prefix?, objName?) {
  var str = [];
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      var v = obj[p];
      if (typeof v == "object") {
        var k = (objName ? objName + '.' : '') + (prefix ? prefix + "[" + p + "]" : p);
        str.push(parseJsonAsQueryString(v, k));
      } else {
        var k = (objName ? objName + '.' : '') + (prefix ? prefix + '.' + p : p);
        str.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
        //str.push(k + "=" + v);
      }
    }
  }
  return str.join("&");
}
