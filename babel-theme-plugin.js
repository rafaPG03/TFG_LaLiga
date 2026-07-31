module.exports = function themeAttributesPlugin({ types: t }) {
  const COLOR_ATTRIBUTES = new Set([
    'color',
    'placeholderTextColor',
    'selectionColor',
    'cursorColor',
    'tintColor',
    'trackColor',
  ]);
  const VISUAL_OBJECT_ATTRIBUTES = new Set(['style', 'theme', 'chartConfig']);

  const runtimeCall = (helperName, args) =>
    t.callExpression(t.memberExpression(t.identifier('globalThis'), t.identifier(helperName)), args);

  return {
    name: 'tfg-runtime-theme-attributes',
    visitor: {
      JSXAttribute(path) {
        const attributeName = path.node.name?.name;
        const value = path.node.value;

        if (COLOR_ATTRIBUTES.has(attributeName)) {
          if (t.isStringLiteral(value) && value.value.startsWith('#')) {
            path.node.value = t.jsxExpressionContainer(
              runtimeCall('__TFG_THEME_COLOR__', [t.stringLiteral(value.value), t.stringLiteral(attributeName)])
            );
          } else if (
            t.isJSXExpressionContainer(value) &&
            t.isStringLiteral(value.expression) &&
            value.expression.value.startsWith('#')
          ) {
            value.expression = runtimeCall('__TFG_THEME_COLOR__', [
              t.stringLiteral(value.expression.value),
              t.stringLiteral(attributeName),
            ]);
          } else if (t.isJSXExpressionContainer(value)) {
            value.expression = runtimeCall('__TFG_THEME_COLOR__', [
              value.expression,
              t.stringLiteral(attributeName),
            ]);
          }
          return;
        }

        if (VISUAL_OBJECT_ATTRIBUTES.has(attributeName) && t.isJSXExpressionContainer(value)) {
          value.expression = runtimeCall('__TFG_THEME_VALUE__', [value.expression]);
        }
      },
    },
  };
};
