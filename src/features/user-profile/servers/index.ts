export class Index {
  data;
  get user() { return this.data; }
  get servers() { return this.data.servers; }

  activate({ slug }) {
    this.data = {
      displayName: "Testaccount1",
      slug: "Testaccount1",
      servers: {
        edges: [{
          id: "POKokpok32232232==",
          name: "Server 1: Changed name",
          slug: "Server-1",
        }],
        totalCount: 1,
      }
    };
  }
}
