import fetchMock from "fetch-mock";

export default function resetFetchMock() {
  fetchMock.removeRoutes();
  fetchMock.clearHistory();
}
