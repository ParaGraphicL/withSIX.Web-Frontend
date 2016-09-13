import { bindable, bindingMode } from 'aurelia-framework';
import { Tools } from '../../services/tools';

export abstract class Field {
    // NO inheritance support atm!
    //@bindable label: string; @bindable useId: string;
    static generateId = (type: string) => `${type}-${Tools.generateGuid()}`
}