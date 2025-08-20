module.exports = {
  extends: [
    "stylelint-config-standard",
  ],
  rules: {
    "no-empty-source": null,
    "rule-empty-line-before": null,
    "declaration-block-single-line-max-declarations": null,
    "comment-empty-line-before": null,
    "no-descending-specificity": null,
    "color-function-notation": null,
    "color-function-alias-notation": null,
    "alpha-value-notation": null,

    // Re-enable practical rules
    "no-duplicate-selectors": true,
    "shorthand-property-no-redundant-values": true,
    "color-hex-length": "short",
    "value-keyword-case": "lower",
    "media-feature-range-notation": "context",
  },
  ignoreFiles: [
    "public/**/*",
    "resources/**/*",
    "node_modules/**/*",
    "themes/karuta/static/css/chroma.css",
  ],
};
