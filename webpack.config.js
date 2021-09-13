const path = require('path')

module.exports = {
  entry: './index.ts',
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  mode: 'none',
  node: false,
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  },
  output: {
    path: path.resolve(__dirname),
    filename: 'webextension-indieauth.js',
    library: {
      name: 'indieauth',
      type: 'commonjs-module'
    }
  }
}
