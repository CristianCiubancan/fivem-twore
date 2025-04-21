import { writeFile } from 'fs/promises';

/**
 * Creates a build process using esbuild.
 * @param watch - Whether to enable watch mode.
 * @param baseOptions - The base build options for esbuild.
 * @param environments - An array of environments with their names and esbuild options.
 * @param onBuild - A callback function that gets called after a successful build.
 */
export async function createBuilder(watch, baseOptions, environments, onBuild) {
  // Dynamically import esbuild or fallback to esbuild-wasm
  let esbuildPkg;
  let useWasm = false;
  try {
    const m = await import('esbuild');
    esbuildPkg = m.default || m;
  } catch {
    try {
      const m = await import('esbuild-wasm');
      esbuildPkg = m;
      // Initialize WebAssembly binary from local esbuild-wasm package
      const wasmURL = new URL(
        '../../node_modules/esbuild-wasm/esbuild.wasm',
        import.meta.url
      ).href;
      await esbuildPkg.initialize({ wasmURL });
      useWasm = true;
    } catch (err) {
      console.error(
        'esbuild is not installed and wasm fallback failed. Skipping build.'
      );
      return;
    }
  }

  const outfiles = {};
  const plugins = [
    {
      name: 'build',
      setup(build) {
        build.onEnd(async (result) => {
          if (result.errors.length === 0) {
            console.log(`Successfully built ${build.initialOptions.outfile}`);
          }
        });
      },
    },
  ];

  await Promise.all(
    environments.map(async ({ name, options }) => {
      // Create the directory for the output file
      const fs = await import('fs/promises');
      await fs.mkdir(`dist/${name}`, { recursive: true });

      // Set outfile to dist/${name}/${name}.js - organize by environment
      outfiles[name] = `dist/${name}/${name}.js`;

      // Merge options - importantly, we keep the entryPoints from the passed in options
      // rather than hardcoding a specific path structure
      options = {
        bundle: true,
        outfile: outfiles[name],
        keepNames: true,
        legalComments: 'inline',
        treeShaking: true,
        ...baseOptions,
        ...options,
      };

      options.plugins = [...(options.plugins || []), ...plugins];

      if (useWasm) {
        // WebAssembly build (no watch support)
        try {
          await esbuildPkg.build(options);
        } catch (err) {
          console.error(`esbuild-wasm build error for ${name}:`, err);
        }
      } else {
        // Native esbuild build using context API
        let ctx;
        try {
          ctx = await esbuildPkg.context(options);
        } catch (err) {
          console.warn(
            `esbuild context error for ${name}: ${err.message}. Falling back to WASM build.`
          );
          // Fallback to WebAssembly build
          try {
            const m = await import('esbuild-wasm');
            esbuildPkg = m;
            const wasmURL = new URL(
              '../../node_modules/esbuild-wasm/esbuild.wasm',
              import.meta.url
            ).href;
            await esbuildPkg.initialize({ wasmURL });
            useWasm = true;
            await esbuildPkg.build(options);
          } catch (err2) {
            console.error(`esbuild-wasm fallback failed for ${name}:`, err2);
          }
          return;
        }

        try {
          if (watch) {
            await ctx.watch();
          } else {
            await ctx.rebuild();
          }
        } catch (err) {
          console.error(`esbuild build error for ${name}:`, err);
        }

        try {
          await ctx.dispose();
        } catch {}
      }
    })
  );

  await writeFile('.yarn.installed', new Date().toISOString());
  await onBuild(outfiles);

  // In non-watch mode, return after build; calling script handles exit
  return;
}
