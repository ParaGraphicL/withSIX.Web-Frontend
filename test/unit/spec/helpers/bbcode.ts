import { BBCodeParser } from '../../../../src/helpers/utils/bbcode/bbCodeParser';
import { BBTag } from '../../../../src/helpers/utils/bbcode/bbTag';

declare var describe;
declare var it;

describe("parse bbcode", () => {
  it("should parse urls", () => {
    var bbTags = [BBTag.createSimpleTag("h1"), BBTag.createSimpleTag("h2"), BBTag.createSimpleTag("h3")];
    // url is broken atm, or at least doesnt seem to support [url=...]
    var parser =  new BBCodeParser(bbTags.concat(BBCodeParser.defaultTags()));
    parser.parseString("[url=http://withsix.com]lalal[/url]").should.equal("<a href=blalbal></a>")
  })
})
