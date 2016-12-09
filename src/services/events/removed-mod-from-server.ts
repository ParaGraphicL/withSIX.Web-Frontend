import { IBasketItem } from "../legacy/baskets";

export class RemovedModFromServer {
  constructor(public mod: IBasketItem, public serverId: string) { }
}
