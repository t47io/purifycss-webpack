const search = require('./search');
const parse = require('./parse');
const purifyCSS = require('./purify-css');

module.exports = function PurifyPlugin(options) {
  return {
    apply(compiler) {
      compiler.plugin('this-compilation', (compilation) => {
        const paths = parse.paths(options.paths);

        // Additional extensions to scan for. This is kept minimal.
        const resolveExtensions = (
          options.resolveExtensions || compiler.options.resolve.extensions
        );

        compilation.plugin('additional-assets', (cb) => {
          // Check only if there is one chunk and if paths are an array
          if (compilation.chunks.length === 1 || Array.isArray(paths)) {
            purifyCSS(
              paths.concat(
                search.additionalFiles(compilation.fileDependencies, resolveExtensions)
              ),
              search.assets(compilation.assets, /\.css$/i),
              parse.options(options.purifyOptions)
            ).forEach(({ key, source }) => {
              compilation.assets[key] = source;
            });
          } else {
            compilation.chunks.forEach((chunk) => {
              purifyCSS(
                paths[chunk.name].concat(
                  search.additionalFiles(
                    chunk.modules, resolveExtensions, ({ resource }) => resource
                  )
                ),
                search.assets(compilation.assets, /\.css$/i).filter(
                  ({ key }) => key.indexOf(chunk.name) >= 0
                ),
                parse.options(options.purifyOptions)
              ).forEach(({ key, source }) => {
                compilation.assets[key] = source;
              });
            });
          }

          cb();
        });
      });
    }
  };
};
