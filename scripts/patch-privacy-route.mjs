import { readFileSync, writeFileSync } from "node:fs";

const p = "src/routeTree.gen.ts";
let s = readFileSync(p, "utf8");

const name = "PortalPrivacy";
const file = "portal.privacy";
const path = "privacy";

const imp = `import { Route as ${name}RouteImport } from './routes/${file}'\n`;
if (!s.includes(imp.trim())) {
  s = s.replace(
    "import { Route as PortalRenewRouteImport } from './routes/portal.renew'\n",
    `import { Route as PortalRenewRouteImport } from './routes/portal.renew'\n${imp}`,
  );
}

if (!s.includes(`const ${name}Route =`)) {
  s = s.replace(
    `const PortalRenewRoute = PortalRenewRouteImport.update({\n  id: '/renew',\n  path: '/renew',\n  getParentRoute: () => PortalRoute,\n} as any)\n`,
    `const PortalRenewRoute = PortalRenewRouteImport.update({\n  id: '/renew',\n  path: '/renew',\n  getParentRoute: () => PortalRoute,\n} as any)\nconst ${name}Route = ${name}RouteImport.update({\n  id: '/${path}',\n  path: '/${path}',\n  getParentRoute: () => PortalRoute,\n} as any)\n`,
  );
}

const mapInsert = `  '/portal/${path}': typeof ${name}Route\n`;
if (!s.includes(mapInsert.trim())) {
  s = s.replaceAll(`  '/portal/renew': typeof PortalRenewRoute\n`, `  '/portal/renew': typeof PortalRenewRoute\n${mapInsert}`);
}

const unionInsert = `    | '/portal/${path}'\n`;
if (!s.includes(unionInsert.trim())) {
  s = s.replaceAll(`    | '/portal/renew'\n`, `    | '/portal/renew'\n${unionInsert}`);
}

if (!s.includes(`'/portal/${path}': {`)) {
  s = s.replace(
    `    '/portal/renew': {
      id: '/portal/renew'
      path: '/renew'
      fullPath: '/portal/renew'
      preLoaderRoute: typeof PortalRenewRouteImport
      parentRoute: typeof PortalRoute
    }
`,
    `    '/portal/renew': {
      id: '/portal/renew'
      path: '/renew'
      fullPath: '/portal/renew'
      preLoaderRoute: typeof PortalRenewRouteImport
      parentRoute: typeof PortalRoute
    }
    '/portal/${path}': {
      id: '/portal/${path}'
      path: '/${path}'
      fullPath: '/portal/${path}'
      preLoaderRoute: typeof ${name}RouteImport
      parentRoute: typeof PortalRoute
    }
`,
  );
}

if (!s.includes(`${name}Route: typeof ${name}Route`)) {
  s = s.replace(
    "  PortalRenewRoute: typeof PortalRenewRoute\n",
    `  PortalRenewRoute: typeof PortalRenewRoute\n  ${name}Route: typeof ${name}Route\n`,
  );
}
if (!s.includes(`${name}Route: ${name}Route,`)) {
  s = s.replace("  PortalRenewRoute: PortalRenewRoute,\n", `  PortalRenewRoute: PortalRenewRoute,\n  ${name}Route: ${name}Route,\n`);
}

writeFileSync(p, s);
console.log("privacy route patched");
