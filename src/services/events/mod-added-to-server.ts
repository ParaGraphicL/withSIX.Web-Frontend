import { IBasketItem } from "../legacy/baskets";

export class ModAddedToServer {
  constructor(public mod: IBasketItem, public serverId: string) { }
}