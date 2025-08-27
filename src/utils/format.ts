import prettier from 'prettier/standalone'
import parserHtml from 'prettier/plugins/html.mjs'
import parserCss from 'prettier/plugins/postcss.mjs'
import parserBabel from 'prettier/plugins/babel.mjs'
import parserEstree from 'prettier/plugins/estree.mjs'

export function formatCode(
  code: string,
  lang: 'html' | 'css' | 'javascript'
): Promise<string> {
  let parser: string
  switch (lang) {
    case 'html':
      parser = 'html'
      break
    case 'css':
      parser = 'css'
      break
    default:
      parser = 'babel'
  }

  const plugins =
    parser === 'babel'
      ? [parserBabel, parserEstree]
      : parser === 'html'
        ? [parserHtml, parserBabel, parserEstree]
        : [parserCss]
  return prettier.format(code, {
    parser,
    plugins,
    tabWidth: 2,
    useTabs: false
  })
}
