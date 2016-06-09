import {RvBase, RvSettings} from './rv';
import {type2} from './base';

export class Arma2 extends RvBase<Arma2Settings> {
  async browseArma2Directory() { let x = await this.browseDir(this.model.arma2GameDirectory); x ? this.model.arma2GameDirectory = x : null }
}

export class Arma2Settings extends RvSettings {
  @type2("checkbox") launchThroughBattlEye: boolean;
  @type2("path") arma2GameDirectory: string;
}
