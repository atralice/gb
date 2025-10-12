import { UserFacingError } from "./UserFacingError";

type MissingSaleContractedPriceErrorParams = {
  relinquishedPropertyId: string;
};

const ERROR_CODE = "MISSING_SALE_CONTRACTED_PRICE";

export class MissingSaleContractedPriceError extends UserFacingError {
  constructor({
    relinquishedPropertyId,
  }: MissingSaleContractedPriceErrorParams) {
    super({
      code: ERROR_CODE,
      sentryMessage: `Cannot determine identification method without saleContractedPriceCents for relinquished property ${relinquishedPropertyId}`,
      userMessage: `Unable to determine identification method (Error: ${ERROR_CODE}).`,
    });
  }
}
