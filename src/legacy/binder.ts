const registry = [];
export function register(fnc: () => void) { registry.push(fnc); }
export function execute() { registry.forEach(x => x()); }
