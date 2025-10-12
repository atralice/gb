import fetchMock, { RouteResponse } from "fetch-mock";

type CreateMockHelperParams<UrlParams> = {
  url: string | ((args: UrlParams) => string);
  response: RouteResponse | { sequence: RouteResponse[] };
  method: "get" | "post" | "put" | "delete" | "patch";
};

const createMockHelper = <UrlParams extends Record<string, any>>({
  url,
  response,
  method,
}: CreateMockHelperParams<UrlParams>) => ({
  url,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  mock: (urlParams: UrlParams = {} as UrlParams) => {
    const resolvedUrl = typeof url === "string" ? url : url(urlParams);

    // TODO: this doesn't handle a json response that is an array
    if ("object" === typeof response && "sequence" in response) {
      // Handle sequential responses
      response.sequence.forEach((res) =>
        fetchMock.once(resolvedUrl, res, { method })
      );
    } else {
      // Handle single response
      fetchMock[method](resolvedUrl, response);
    }

    return {
      getCallLogs: () => fetchMock.callHistory.calls(resolvedUrl),
      responseHistory: () =>
        fetchMock.callHistory.callLogs
          .filter((log) => log.url === resolvedUrl)
          .map((log) => log.route?.config.response),
    };
  },
});

export default createMockHelper;
