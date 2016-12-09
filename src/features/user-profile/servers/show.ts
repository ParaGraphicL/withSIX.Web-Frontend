export class Show {
  data;

  get server() { return this.data.server; }
  get user() { return this.data.user; }

  activate(params) {
    this.data = {
      server: {
        id: "afeafeafeafae==",
        description: "The most supperest most awesomest server",
        name: "Server 1: Changed name",
        slug: "Server-1",
      },
      user: {
        displayName: "Testaccount1",
        slug: "Testaccount1",
      },
    }
  }
}
