import { BackendModule, ReadCallback, Services } from "i18next";
import { cms } from "./cms.server";

export type I18NextBackendOptions = {
  request: Request;
};

export class I18NextBackend implements BackendModule<I18NextBackendOptions> {
  public static type = "backend" as const;
  public type = "backend" as const;

  private request?: Request;

  public init(_: Services, { request }: I18NextBackendOptions): void {
    this.request = request;
  }

  public async read(
    language: string,
    _: string,
    callback: ReadCallback,
  ): Promise<void> {
    if (!this.request) {
      callback(new Error("Request is not set"), null);
      return;
    }

    const common = await cms().getCommon(this.request, language);
    callback(null, common.uiLabels);
  }
}
