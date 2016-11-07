declare interface AsyncRetryable {
    executeForPromise<T>(fn: () => Promise<T>): Promise<T>;
    executeForNode<T>(fn: () => T): T;
}

declare interface Retryable extends AsyncRetryable {
    execute<T>(fn: () => T): T;
}

declare interface Polly {
    handle(fn: (err: Error) => boolean): Polly
    retry(): Retryable
    waitAndRetry(delays): AsyncRetryable
}

declare const polly: () => Polly;

declare module "polly-js" {
    export default polly;
}
