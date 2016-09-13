interface IModel {
    scope: string;
}

export class HostServer {
    scopes = ["Public", "Unlisted", "Private"]
    model;
    activate() {
        this.model = {
            scope: "Public"
        }
    }
}