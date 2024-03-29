const path = require("path");

// configure to build CKEditor
const CKEditorWebpackPlugin = require("@ckeditor/ckeditor5-dev-webpack-plugin");
const { styles } = require("@ckeditor/ckeditor5-dev-utils");

module.exports = {
    configureWebpack: {
        devtool: "source-map",
        // target: "electron-renderer",
        plugins: [
            // CKEditor needs its own plugin to be built using webpack.
            new CKEditorWebpackPlugin({
                // See https://ckeditor.com/docs/ckeditor5/latest/features/ui-language.html
                language: "en",
            }),
        ],
    },
    transpileDependencies: ["vuetify", /ckeditor5-[^/\\]+[/\\]src[/\\].+\.js$/],
    // Vue CLI would normally use its own loader to load .svg and .css files, however:
    //	1. The icons used by CKEditor must be loaded using raw-loader,
    //	2. The CSS used by CKEditor must be transpiled using PostCSS to load properly.
    chainWebpack: config => {
        // (1.) To handle editor icons, get the default rule for *.svg files first:
        const svgRule = config.module.rule("svg");

        // Then you can either:
        //
        // * clear all loaders for existing 'svg' rule:
        //
        //		svgRule.uses.clear();
        //
        // * or exclude ckeditor directory from node_modules:
        svgRule.exclude.add(path.join(__dirname, "node_modules", "@ckeditor"));

        // Add an entry for *.svg files belonging to CKEditor. You can either:
        //
        // * modify the existing 'svg' rule:
        //
        //		svgRule.use( 'raw-loader' ).loader( 'raw-loader' );
        //
        // * or add a new one:
        config.module
            .rule("cke-svg")
            .test(/ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/)
            .use("raw-loader")
            .loader("raw-loader");

        // (2.) Transpile the .css files imported by the editor using PostCSS.
        // Make sure only the CSS belonging to ckeditor5-* packages is processed this way.
        config.module
            .rule("cke-css")
            .test(/ckeditor5-[^/\\]+[/\\].+\.css$/)
            .use("postcss-loader")
            .loader("postcss-loader")
            .tap(() => {
                return styles.getPostCssConfig({
                    themeImporter: {
                        themePath: require.resolve(
                            "@ckeditor/ckeditor5-theme-lark"
                        ),
                    },
                    minify: true,
                });
            });
    },
    pluginOptions: {
        electronBuilder: {
            appId: "com.myteam.app",
            nodeIntegration: true,
            customFileProtocol: 'myteam://./',
            builderOptions: {
                win: {
                    signAndEditExecutable: true,
                    target: ["portable"],
                },
                portable: {
                    artifactName: "${name}-${os}-portable.${version}.exe",
                },
            },
            chainWebpackMainProcess: config => {
                // Chain webpack config for electron main process only
            },
            chainWebpackRendererProcess: config => {
                // Chain webpack config for electron renderer process only
                // The following example will set IS_ELECTRON to true in your app
                config.plugin("define").tap(args => {
                    args[0]["IS_ELECTRON"] = true;
                    return args;
                });
            },
        },
    },
};
