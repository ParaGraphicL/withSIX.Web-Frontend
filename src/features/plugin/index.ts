export class Index {
    parentOrigin: string;
    activate() {
        this.parentOrigin = location.search.substring(5);
        window.addEventListener('message', this.listener, false);
        this.send("Hello from withSIX.com!");
    }

    deactivate() {
        window.removeEventListener('message', this.listener);
    }

    listener = (e: MessageEvent) => {
        if (e.origin === this.parentOrigin) console.log("Received message from plugin: ", e);
        else console.log("Received message from unknown origin: ", e);
    }

    send = data => window.parent.postMessage(data, this.parentOrigin)
}