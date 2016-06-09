interface Window {
  six_client: {
    open_pws_uri: (url) => void;
    refresh_login(): void;
    login(accessToken: string): void;
    subscribedToCollection(id: string): void;
    unsubscribedFromCollection(id: string): void;
  }
  assetHash: { [asset: string]: string }
  api: {
    openExternalUrl(url: string): void
  }
}
