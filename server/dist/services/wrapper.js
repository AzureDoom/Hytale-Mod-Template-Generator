import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.resolve(__dirname, '../../cache');
function parseGradleVersion(distributionUrl) {
    const match = distributionUrl.match(/gradle-([^/]+?)-(?:bin|all)\.zip$/);
    if (!match) {
        throw new Error(`Could not determine the Gradle version from GRADLE_DISTRIBUTION_URL: ${distributionUrl}`);
    }
    return match[1];
}
function buildCandidateJarUrls(version) {
    return [
        `https://raw.githubusercontent.com/gradle/gradle/v${version}/gradle/wrapper/gradle-wrapper.jar`,
        `https://raw.githubusercontent.com/gradle/gradle/gradle-${version}/gradle/wrapper/gradle-wrapper.jar`
    ];
}
export async function resolveGradleWrapperJar() {
    await mkdir(cacheDir, { recursive: true });
    const version = parseGradleVersion(config.gradleDistributionUrl);
    const cachedPath = path.join(cacheDir, `gradle-wrapper-${version}.jar`);
    try {
        return await readFile(cachedPath);
    }
    catch {
        // continue
    }
    const candidates = buildCandidateJarUrls(version);
    for (const url of candidates) {
        const response = await fetch(url);
        if (!response.ok)
            continue;
        const bytes = Buffer.from(await response.arrayBuffer());
        await writeFile(cachedPath, bytes);
        return bytes;
    }
    throw new Error([
        `Could not fetch gradle-wrapper.jar for Gradle ${version}.`,
        `GRADLE_DISTRIBUTION_URL is the source of truth, so the server attempted to derive the wrapper JAR from that version.`,
        `Checked: ${candidates.join(', ')}`
    ].join(' '));
}
