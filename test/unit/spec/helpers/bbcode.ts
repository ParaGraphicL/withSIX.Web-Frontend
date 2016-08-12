import { BBCodeParser } from '../../../../src/helpers/utils/bbcode/bbCodeParser';
import { BBTag } from '../../../../src/helpers/utils/bbcode/bbTag';

describe("parse bbcode", () => {
  var bbTags = [BBTag.createSimpleTag("h1"), BBTag.createSimpleTag("h2"), BBTag.createSimpleTag("h3")];
  var parser;
  beforeEach(() => {
    // url is broken atm, or at least doesnt seem to support [url=...]
    parser =  new BBCodeParser(bbTags.concat(BBCodeParser.defaultTags()));
  })

  it("should parse urls", () => {
    parser.parseString("[url=\"http://withsix.com\"]lalal[/url]")
      .should.equal('<a href="http://withsix.com" target="_blank">lalal</a>')
    parser.parseString("[url=http://withsix.com]lalal[/url]")
      .should.equal('<a href="http://withsix.com" target="_blank">lalal</a>')
    parser.parseString("[url=\"http://withsix.com\"]lalal[/url]")
      .should.equal('<a href="http://withsix.com" target="_blank">lalal</a>')
  })
  describe("should handle incomplete tags", () => {
    // TODO: It should still add the invalid bbcode for display?
    it("handles missing end tag", () => {
      parser.parseString("[h1]Advanced Combat Environment 3 (ACE3)[/h1] [URL=http://www.ace3mod.com][url]http://ace3mod.com/img/ace3-logo-black_600.png[/url]")
        .should.equal('<h1>Advanced Combat Environment 3 (ACE3)</h1> <a href="http://ace3mod.com/img/ace3-logo-black_600.png" target="_blank">http://ace3mod.com/img/ace3-logo-black_600.png</a>')
        //.should.equal('<h1>Advanced Combat Environment 3 (ACE3)</h1> [URL=http://www.ace3mod.com]<a href="http://ace3mod.com/img/ace3-logo-black_600.png" target="_blank">http://ace3mod.com/img/ace3-logo-black_600.png</a>')
    })

    it("handles missing start tag", () => {
      parser.parseString("[h1]Advanced Combat Environment 3 (ACE3)[/h1] [/url][url]http://ace3mod.com/img/ace3-logo-black_600.png[/url]")
        .should.equal('<h1>Advanced Combat Environment 3 (ACE3)</h1> <a href="http://ace3mod.com/img/ace3-logo-black_600.png" target="_blank">http://ace3mod.com/img/ace3-logo-black_600.png</a>')
    })
  })
})
