import { readJson } from "./readJson.js";
import { writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "node:path";
/**
 * Reduces an array into a formatted string.
 * @param name - The name of the section.
 * @param files - The array of file names.
 * @returns The reduced string or an empty string if the array is empty.
 */
function reduceArray(name, files) {
    return files?.[0]
        ? `\n${name} {${files.reduce((acc, value) => {
            return value ? `${acc}\n\t'${value}',` : acc;
        }, "")}\n}\n`
        : "";
}
/**
 * Reduces an object into a formatted string.
 * @param object - The object to reduce.
 * @returns The reduced string.
 */
function reduceObject(object) {
    return Object.entries(object).reduce((acc, [key, value]) => {
        return value ? `${acc}${key} '${value}'\n` : acc;
    }, "");
}
/**
 * Creates the `fxmanifest.lua` file based on the resource manifest.
 * @param resourceManifest - The resource manifest containing script and file information.
 * @returns The generated `fxmanifest.lua` content as a string.
 */
export async function createFxmanifest({ client_scripts, server_scripts, files, dependencies, metadata, }) {
    // Find the nearest package.json by searching upwards from current directory
    let dir = process.cwd();
    let pkgPath;
    while (true) {
        const candidate = path.join(dir, 'package.json');
        if (existsSync(candidate)) {
            pkgPath = candidate;
            break;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            console.error('package.json not found');
            process.exit(1);
        }
        dir = parent;
    }
    const pkg = await readJson(pkgPath);
    const fxmanifest = {
        name: pkg.name,
        author: pkg.author,
        version: pkg.version,
        license: pkg.license,
        repository: pkg.repository?.url,
        description: pkg.description,
        fx_version: "cerulean",
        game: "gta5",
        ...(metadata || {}),
    };
    let output = reduceObject(fxmanifest);
    output += reduceArray("files", files);
    output += reduceArray("dependencies", dependencies);
    output += reduceArray("client_scripts", client_scripts);
    output += reduceArray("server_scripts", server_scripts);
    await writeFile("fxmanifest.lua", output);
    return output;
}
