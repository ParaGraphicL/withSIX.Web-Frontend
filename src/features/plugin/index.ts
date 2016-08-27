export class Index {
    activate() {
        window.addEventListener('message', this.listener, false);
    }

    deactiavte() {
        window.removeEventListener('message', this.listener);
    }

    listener = function(e: MessageEvent) {
        console.log("Received message: ", e);
    }
}