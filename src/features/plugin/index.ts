import { HttpClient } from 'aurelia-fetch-client';
import { inject } from 'aurelia-framework';

@inject(HttpClient)
export class Index {
    constructor(private http: HttpClient) {}
    parentOrigin: string;
    async activate(params) {
        this.parentOrigin = params.ref;
        let browser = params.browser;
        window.addEventListener('message', this.listener, false);
        try {
            this.send("Hello from withSIX.com!");
        } catch (e) {
            console.error(e);
        }

        this.http.fetch("https://127.0.0.66:48666/api/ping-plugin", {
            method: 'post',
            body: JSON.stringify({browser: 1})
        });
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