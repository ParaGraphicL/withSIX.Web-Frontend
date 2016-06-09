import {ActiveValueConverter, IpEndpointValueConverter, ProgressValueConverter, SizeValueConverter} from '../../../../src/resources/converters';

describe("ActiveValueConverter", () => {
  let sut: ActiveValueConverter;
  beforeEach(() => sut = new ActiveValueConverter());
  it("converts 0's to just 0", () => sut.toView(0, 0).should.equal('0'));
  it("converts positives", () => sut.toView(1, 1).should.equal('1 / 1'));
  it("converts positives", () => sut.toView(1, 2).should.equal('1 / 2'));
});

describe("IpEndpointValueConverter", () => {
  let sut: IpEndpointValueConverter;
  beforeEach(() => sut = new IpEndpointValueConverter());
  it("converts", () => sut.toView(null).should.equal(""))
  it("converts", () => sut.toView({address: "127.0.0.1", port: 2302}).should.equal("127.0.0.1:2302"))
})

// TODO: we're actually testing the numeral library here.. instead it should be mocked!
describe("ProgressValueConverter", () => {
  let sut: ProgressValueConverter;
  beforeEach(() => sut = new ProgressValueConverter());
  it("converts", () => sut.toView(33).should.equal("33%"));
  it("converts", () => sut.toView(33.33).should.equal("33.33%"));
  it("converts", () => sut.toView(33.333).should.equal("33.33%"));
})

// TODO: we're actually testing the numeral library here.. instead it should be mocked!
describe("SizeValueConverter", () => {
  let sut: SizeValueConverter;
  beforeEach(() => sut = new SizeValueConverter());
  it("converts", () => sut.toView(33).should.equal("33B"));
  it("converts", () => sut.toView(3333).should.equal("3.25KB"));
  it("converts", () => sut.toView(33333).should.equal("32.55KB"));
  it("converts", () => sut.toView(333333).should.equal("325.52KB"));
  it("converts", () => sut.toView(3333333).should.equal("3.18MB"));
  it("converts", () => sut.toView(3333333333).should.equal("3.1GB"));
  it("converts", () => sut.toView(3333333333333).should.equal("3.03TB"));
  it("converts", () => sut.toView(3333333333333333).should.equal("2.96PB"));
})
