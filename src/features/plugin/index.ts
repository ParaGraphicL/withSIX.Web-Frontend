export class Index {
    parentOrigin: string;
    activate(params) {
        this.parentOrigin = params.ref;
        window.addEventListener('message', this.listener, false);
        try {
            this.send("Hello from withSIX.com!");
        } catch (e) {
            console.error(e);
        }
    }

    deactivate() {
        window.removeEventListener('message', this.listener);
    }

    listener = (e: MessageEvent) => {
        if (e.origin === this.parentOrigin) console.log("Received message from plugin: ", e);
        else console.warn("Received message from unknown origin: ", e);
    }

    send = data => window.parent.postMessage(data, this.parentOrigin)
}