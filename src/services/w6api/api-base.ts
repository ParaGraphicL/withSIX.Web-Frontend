import { W6Context } from "../w6context";
import { ICancellationToken } from "../reactive";
import { Tools } from "../tools";

import { createError } from "../../helpers/utils/errors";

//const OperationCancelledException = createError("OperationCancelledException", Tools.AbortedException);
const OperationFailedException = createError("OperationFailedException");


enum OperationState {
  Queued,
  Progressing,
  Completed,
  Cancelled,
  Failed
}

interface IOperationStatus {
  state: OperationState;
  message?: string;
  progress?: number;
}

interface IOperationStatusT<T> extends IOperationStatus {
  result: T;
}

export abstract class ApiBase {
  constructor(private ctx: W6Context, private basePath: string) { }

  // TODO: Location based job redir
  protected _get<T>(path: string) { return this.ctx.getCustom<T>(`${this.basePath}${path}`); }
  protected _delete<T>(path: string) { return this.ctx.deleteCustom<T>(`${this.basePath}${path}`); }
  protected _post<T>(path: string, data?) { return this.ctx.postCustom<T>(`${this.basePath}${path}`, data); }

  protected delay(delay: number) { return new Promise((res) => setTimeout(res, delay)); }

  protected async _pollOperationState<T>(id: string, operationId: string, ct?: ICancellationToken) {
    let status: IOperationStatusT<T> = { state: OperationState.Queued, result: null };

    while ((!ct || !ct.isCancellationRequested) && status.state < OperationState.Completed) {
      //try {
      status = await this.getOperation<T>(id, operationId);
      //} catch (err) {
      // todo
      //}
      await this.delay(2000);
    }
    if (ct && ct.isCancellationRequested && status.state < OperationState.Completed) {
      await this.cancelOperation(id, operationId);
      status.state = OperationState.Cancelled;
    }
    if (status.state !== OperationState.Completed) {
      if (status.state === OperationState.Cancelled) { throw new Tools.AbortedException(status.message); }
      throw new OperationFailedException(`Operation did not succeed: ${OperationState[status.state]} ${status.message}`);
    }
    return status.result;
  }

  private cancelOperation(id: string, operationId: string) { return this._delete(`/${id}/operations/${operationId}`); }
  private getOperation<T>(id: string, operationId: string) { return this._get<IOperationStatusT<T>>(`/${id}/operations/${operationId}`); }
}