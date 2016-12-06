export class AddAttributeBindingBehavior {
  bind(binding, source) {
    binding.targetObserver = new AddAttributeObserver(binding.target, binding.targetProperty);
  }
}

class AddAttributeObserver {
  constructor(private element, private propertyName) { }

  getValue() {
    return this.element.getAttribute(this.propertyName);
  }

  setValue(newValue) {
    if (newValue) {
      this.element.removeAttribute(this.propertyName);
    } else {
      this.element.setAttribute(this.propertyName, newValue);
    }
  }

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "${this.propertyName}" property is not supported.`);
  }
}
