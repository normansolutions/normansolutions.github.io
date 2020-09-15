module.exports = {
<<<<<<< HEAD
  plugins: {
    "@fullhuman/postcss-purgecss": {
      content: ["./layouts/**/*.html", "./assets/*.js"],
      whitelist: [
        "highlight",
        "language-bash",
        "pre",
        "video",
        "code",
        "content",
        "h3",
        "h4",
        "ul",
        "li",
        "iframe",
        "img"
      ],
      whitelistPatterns: [/fancybox/]
    },
    autoprefixer: {},
    cssnano: { preset: "default" }
  }
};
=======
    plugins: {
        '@fullhuman/postcss-purgecss': {
            content: [
                './layouts/**/*.html',
                './assets/*.js',
            ],
            whitelist: [
                'highlight',
                'language-bash',
                'pre',
                'video',
                'code',
                'content',
                'h3',
                'h4',
                'ul',
                'li',
                'iframe',
                'img'
            ],
            whitelistPatterns: [
            ],

        },
        autoprefixer: {},
        cssnano: { preset: 'default' }
    }
};
>>>>>>> parent of aab7f71... Added fancybox and resolved local bundling
