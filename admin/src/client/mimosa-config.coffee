exports.config =
  minMimosaVersion:'1.0.0'

  modules: [
    'server'
    'require'
    'minify'
    'live-reload'
    'combine'
    'requirebuild-include'
    'requirebuild-textplugin-include'
    'bower'
    'lint'
  ]

  watch:
    javascriptDir: 'javascripts/app'

  requireBuildTextPluginInclude:
    pluginPath: 'text'
    extensions: ['html']

  requireBuildInclude:
    folder:"javascripts"
    patterns: ['app/**/*.js', 'vendor/durandal/**/*.js']

  bower:
    copy:
      mainOverrides:
        "async":["lib/async.js"]
        "knockout.js":["knockout.js","knockout-2.3.0.debug.js"]
        # "bootstrap": [
        #   "docs/assets/js/bootstrap.js"
        #   "docs/assets/css/bootstrap.css"
        #   "docs/assets/css/bootstrap-responsive.css"
        # ]
        "font-awesome": [
          { font: "../../font" }
          "css/font-awesome.css"
          "css/font-awesome-ie7.css"
        ]
        "durandal": [
          {
            img: "../../images"
            js: "durandal"
            css: "durandal"
          }
        ]

  combine:
    folders: [
      {
        folder:'stylesheets'
        output:'stylesheets/styles.css'
        order: [
          'vendor/bootstrap/bootstrap.css'
          'vendor/bootstrap/bootstrap-responsive.css'
          'vendor/font-awesome/font-awesome.css'
          'vendor/durandal/durandal.css'
          'starterkit.css'
        ]
      }
    ]

  server:
    port: 3300
    path: '../server/admin.js'
    defaultServer:
      enabled: false
      onePager: true
    views:
      compileWith: 'html'
      extension: 'html'
      path: '../client/views'

  require:
    optimize:
      overrides:
        name: '../vendor/almond-custom'
        inlineText: true
        stubModules: ['text']
        pragmas:
          build: true