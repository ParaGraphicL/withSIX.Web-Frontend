// <input ref="test" disabled.bind="myInput.checked & removeAttribute">
export class RemoveAttributeBindingBehavior {
  //originalObserver;
  bind(binding, source) {
    //this.originalObserver = binding.targetObserver; // undoing this seems to break the thing :()
    binding.targetObserver = new RemoveAttributeObserver(binding.target, binding.targetProperty);
  }
  unbind(binding) { } // binding.targetObserver = this.originalObserver;
}

class RemoveAttributeObserver {
  constructor(private element, private propertyName) { }

  getValue() {
    return this.element.getAttribute(this.propertyName);
  }

  setValue(newValue) {
    if (newValue) {
      this.element.setAttribute(this.propertyName, newValue);
    } else {
      this.element.removeAttribute(this.propertyName);
    }
  }

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "${this.propertyName}" property is not supported.`);
  }
}
