import type { Patchline } from '../types.js';
import { config } from '../config.js';

const DEFAULT_VERSIONS: Record<Patchline, string[]> = {
  release: ['2026.02.19-1a311a592'],
  'pre-release': ['2026.03.20-db226053c']
};

type VersionKind = 'semver' | 'dateHash' | 'other';

interface ParsedVersion {
  raw: string;
  kind: VersionKind;
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  date?: number;
}

const VERSION_PATTERN =
  /^(?:v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?|\d{4}\.\d{2}\.\d{2}-[A-Za-z0-9._-]+)$/i;

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

function parseVersion(value: string): ParsedVersion {
  const raw = value.trim();

  const dateHash = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})-[A-Za-z0-9._-]+$/i);

  if (dateHash) {
    return {
      raw,
      kind: 'dateHash',
      major: 0,
      minor: 0,
      patch: 0,
      prerelease: [],
      date: Number(`${dateHash[1]}${dateHash[2]}${dateHash[3]}`)
    };
  }

  const semver = raw.match(
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/i
  );

  if (semver) {
    return {
      raw,
      kind: 'semver',
      major: Number(semver[1]),
      minor: Number(semver[2]),
      patch: Number(semver[3]),
      prerelease: semver[4]?.split('.') ?? []
    };
  }

  return {
    raw,
    kind: 'other',
    major: 0,
    minor: 0,
    patch: 0,
    prerelease: []
  };
}

function comparePrereleaseDesc(a: string[], b: string[]) {
  // Stable releases sort above prereleases for the same x.y.z.
  if (!a.length && b.length) return -1;
  if (a.length && !b.length) return 1;
  if (!a.length && !b.length) return 0;

  const length = Math.max(a.length, b.length);

  for (let i = 0; i < length; i++) {
    const left = a[i];
    const right = b[i];

    if (left === undefined) return 1;
    if (right === undefined) return -1;

    const leftNum = /^\d+$/.test(left) ? Number(left) : null;
    const rightNum = /^\d+$/.test(right) ? Number(right) : null;

    if (leftNum !== null && rightNum !== null && leftNum !== rightNum) {
      return rightNum - leftNum;
    }

    if (leftNum !== null && rightNum === null) return 1;
    if (leftNum === null && rightNum !== null) return -1;

    const textCompare = right.localeCompare(left, undefined, {
      numeric: true,
      sensitivity: 'base'
    });

    if (textCompare !== 0) return textCompare;
  }

  return 0;
}

function compareSemverDesc(a: ParsedVersion, b: ParsedVersion) {
  return (
    b.major - a.major ||
    b.minor - a.minor ||
    b.patch - a.patch ||
    comparePrereleaseDesc(a.prerelease, b.prerelease)
  );
}

function sortVersions(versions: string[]) {
  return [...versions].sort((left, right) => {
    const a = parseVersion(left);
    const b = parseVersion(right);

    const priority: Record<VersionKind, number> = {
      semver: 0,
      dateHash: 1,
      other: 2
    };

    const kindCompare = priority[a.kind] - priority[b.kind];
    if (kindCompare !== 0) return kindCompare;

    if (a.kind === 'semver' && b.kind === 'semver') {
      return compareSemverDesc(a, b);
    }

    if (a.kind === 'dateHash' && b.kind === 'dateHash') {
      return (b.date ?? 0) - (a.date ?? 0);
    }

    return right.localeCompare(left, undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  });
}

function parseVersionsFromMetadataXml(xml: string) {
  const matches = [...xml.matchAll(/<version>([^<]+)<\/version>/g)]
    .map((match) => match[1].trim())
    .filter((candidate) => VERSION_PATTERN.test(candidate));

  return [...new Set(matches)];
}

function parseVersionsFromListing(html: string) {
  const hrefMatches = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]);

  const folderVersions = hrefMatches
    .map((href) => href.replace(/\/$/, '').split('/').pop() || '')
    .filter((candidate) => VERSION_PATTERN.test(candidate));

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
    versions: sortVersions(DEFAULT_VERSIONS[patchline]),
    source: 'fallback' as const,
    url: getRepoBase(patchline)
  };
}