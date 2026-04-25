import type { Patchline } from '../types.js';
import { config } from '../config.js';

const DEFAULT_VERSIONS: Record<Patchline, string[]> = {
  release: ['2026.02.19-1a311a592'],
  'pre-release': ['2026.03.20-db226053c']
};

function getRepoBase(patchline: Patchline) {
  return patchline === 'pre-release' ? config.hytaleMavenPreReleaseUrl : config.hytaleMavenReleaseUrl;
}

function buildMetadataCandidates(baseUrl: string) {
  const clean = baseUrl.replace(/\/$/, '');
  return [
    `${clean}/com/hypixel/hytale/Server/maven-metadata.xml`,
    `${clean}/com/hypixel/hytale/server/maven-metadata.xml`,
    `${clean}/com/hypixel/hytale/Server/`,
    `${clean}/com/hypixel/hytale/server/`
  ];
}

function sortVersions(versions: string[]) {
  return [...versions].sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }));
}

function parseVersionsFromMetadataXml(xml: string) {
  const matches = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map((match) => match[1].trim());
  return [...new Set(matches)];
}

function parseVersionsFromListing(html: string) {
  const hrefMatches = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]);
  const folderVersions = hrefMatches
    .map((href) => href.replace(/\/$/, '').split('/').pop() || '')
    .filter((candidate) => /^\d{4}\.\d{2}\.\d{2}-[A-Za-z0-9._-]+$/i.test(candidate));
  return [...new Set(folderVersions)];
}

export async function getVersions(patchline: Patchline) {
  const candidates = buildMetadataCandidates(getRepoBase(patchline));

  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const body = await response.text();
      const versions = url.endsWith('.xml') ? parseVersionsFromMetadataXml(body) : parseVersionsFromListing(body);
      if (versions.length) {
        return {
          patchline,
          versions: sortVersions(versions),
          source: 'hytale-maven' as const,
          url
        };
      }
    } catch {
      // try next candidate
    }
  }

  return {
    patchline,
    versions: DEFAULT_VERSIONS[patchline],
    source: 'fallback' as const,
    url: getRepoBase(patchline)
  };
}
