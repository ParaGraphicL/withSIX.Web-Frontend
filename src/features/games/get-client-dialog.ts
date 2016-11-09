import { Dialog } from '../../framework';

interface IClientInfo {
  logo: string;
  title: string;
  gameName: string;
}

export class GetClientDialog extends Dialog<IClientInfo> {
  get defaultBackUrl() { return this.w6.url.img.unknown; }
}