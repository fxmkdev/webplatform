export type RootPathValidationError =
  | "mustNotEndWithSlash"
  | "mustStartWithSlash";

export function normalizePathnameInput(pathname: string) {
  return pathname.trim();
}

export function validateRootPathFormat(
  rootPath: string,
): RootPathValidationError | true {
  const normalizedRootPath = normalizePathnameInput(rootPath);

  if (!normalizedRootPath.startsWith("/")) {
    return "mustStartWithSlash";
  }

  if (normalizedRootPath !== "/" && normalizedRootPath.endsWith("/")) {
    return "mustNotEndWithSlash";
  }

  return true;
}

export function pathnameBelongsToRootPath(pathname: string, rootPath: string) {
  const normalizedPathname = normalizePathnameInput(pathname);
  const normalizedRootPath = normalizePathnameInput(rootPath);
  const safePrefix = normalizedRootPath.endsWith("/")
    ? normalizedRootPath
    : normalizedRootPath + "/";

  return (
    normalizedPathname === normalizedRootPath ||
    normalizedPathname.startsWith(safePrefix)
  );
}
