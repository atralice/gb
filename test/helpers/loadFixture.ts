import { readFileSync } from "fs";
import { join } from "path";

export function loadFixture(fixturePath: string) {
    const fixturesPath = join(__dirname, "../fixtures/", fixturePath);
    const fixtures = JSON.parse(readFileSync(fixturesPath, "utf-8"));
    return fixtures;
}
