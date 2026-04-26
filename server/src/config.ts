import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3001),
  appOrigin: process.env.APP_ORIGIN || '*',
  gradleDistributionUrl:
    process.env.GRADLE_DISTRIBUTION_URL ||
    'https://services.gradle.org/distributions/gradle-9.4.0-bin.zip',
  hytaleMavenReleaseUrl:
    process.env.HYTALE_MAVEN_RELEASE_URL ||
    'https://maven.hytale.com/release',
  hytaleMavenPreReleaseUrl:
    process.env.HYTALE_MAVEN_PRERELEASE_URL ||
    'https://maven.hytale.com/pre-release',
  showStatusBanner: process.env.SHOW_STATUS_BANNER === 'true'
};
