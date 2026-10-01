import { readFileSync, writeFileSync } from "node:fs";

const p = "src/routeTree.gen.ts";
let s = readFileSync(p, "utf8");

function once(haystack, needle, insertAfter) {
  if (haystack.includes(insertAfter.trim())) return haystack;
  const i = haystack.indexOf(needle);
  if (i < 0) throw new Error(`Missing needle: ${needle.slice(0, 80)}`);
  return haystack.slice(0, i + needle.length) + insertAfter + haystack.slice(i + needle.length);
}

const routes = [
  ["AdminMentorship", "admin.mentorship", "mentorship"],
  ["AdminUsers", "admin.users", "users"],
  ["AdminJobs", "admin.jobs", "jobs"],
];

for (const [name, file, path] of routes) {
  const imp = `import { Route as ${name}RouteImport } from './routes/${file}'\n`;
  if (!s.includes(imp.trim())) {
    s = s.replace(
      "import { Route as AdminCmsRouteImport } from './routes/admin.cms'\n",
      `import { Route as AdminCmsRouteImport } from './routes/admin.cms'\n${imp}`,
    );
  }

  const def = `const ${name}Route = ${name}RouteImport.update({\n  id: '/${path}',\n  path: '/${path}',\n  getParentRoute: () => AdminRoute,\n} as any)\n`;
  if (!s.includes(`const ${name}Route =`)) {
    s = s.replace(
      `const AdminCmsRoute = AdminCmsRouteImport.update({\n  id: '/cms',\n  path: '/cms',\n  getParentRoute: () => AdminRoute,\n} as any)\n`,
      `const AdminCmsRoute = AdminCmsRouteImport.update({\n  id: '/cms',\n  path: '/cms',\n  getParentRoute: () => AdminRoute,\n} as any)\n${def}`,
    );
  }

  // three interface maps contain the same cms line — insert after each occurrence once
  const mapNeedle = `  '/admin/cms': typeof AdminCmsRoute\n`;
  const mapInsert = `  '/admin/${path}': typeof ${name}Route\n`;
  if (!s.includes(mapInsert.trim())) {
    let count = 0;
    s = s.replaceAll(mapNeedle, () => {
      count += 1;
      return mapNeedle + mapInsert;
    });
    if (count < 1) throw new Error("cms type map not found");
  }

  const unionNeedle = `    | '/admin/cms'\n`;
  const unionInsert = `    | '/admin/${path}'\n`;
  if (!s.includes(unionInsert.trim())) {
    s = s.replaceAll(unionNeedle, unionNeedle + unionInsert);
  }

  const pathBlock = `    '/admin/${path}': {
      id: '/admin/${path}'
      path: '/${path}'
      fullPath: '/admin/${path}'
      preLoaderRoute: typeof ${name}RouteImport
      parentRoute: typeof AdminRoute
    }
`;
  if (!s.includes(`'/admin/${path}': {`)) {
    s = s.replace(
      `    '/admin/cms': {
      id: '/admin/cms'
      path: '/cms'
      fullPath: '/admin/cms'
      preLoaderRoute: typeof AdminCmsRouteImport
      parentRoute: typeof AdminRoute
    }
`,
      `    '/admin/cms': {
      id: '/admin/cms'
      path: '/cms'
      fullPath: '/admin/cms'
      preLoaderRoute: typeof AdminCmsRouteImport
      parentRoute: typeof AdminRoute
    }
${pathBlock}`,
    );
  }

  if (!s.includes(`${name}Route: typeof ${name}Route`)) {
    s = once(s, "  AdminCmsRoute: typeof AdminCmsRoute\n", `  ${name}Route: typeof ${name}Route\n`);
  }
  if (!s.includes(`${name}Route: ${name}Route,`)) {
    s = once(s, "  AdminCmsRoute: AdminCmsRoute,\n", `  ${name}Route: ${name}Route,\n`);
  }
}

writeFileSync(p, s);
console.log("ok");
