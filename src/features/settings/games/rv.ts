import {inject} from 'aurelia-framework';
import {ViewModel,handlerFor,Query,VoidCommand,DbClientQuery,IGameSettingsEntry,IGameSettings} from '../../../framework';
import {GameSettingsVM, GameSettingsWithPackage, type2} from './base';

//var dialog = <any>require('dialog');

export class RvBase<T extends RvSettings> extends GameSettingsVM<T> {
  async browsePackageDirectory() { let x = await this.browseDir(this.model.repoDirectory); x ? this.model.packageDirectory = x : null }
}

export class Rv extends RvBase<RvSettings> {}

export class RvSettings extends GameSettingsWithPackage {
}

// // I dont think the startup parameter editor is too important right now ;-)
// // but decorated, and using the metadata in the UI would be a great idea ;-)
// export class RvStartupParameters {
//   name;
//   @type2("checkbox") noSplash: boolean;
//   @type2("checkbox") skipIntro: boolean;
//   @type2("checkbox") window: boolean;
//   @type2("checkbox") checkSignatures: boolean;
//   @type2("number") cpuCount: number;
// }
