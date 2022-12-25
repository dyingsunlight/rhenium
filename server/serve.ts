import Koa from 'koa'
import { Readability } from '@mozilla/readability'
import KoaStatic from 'koa-static'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import path from 'path'
import process from 'process'

const app = new Koa()
const pwd = process.cwd()
const template = fs.readFileSync(path.join(pwd, './server/template.html'), 'utf-8')
app.use(KoaStatic(path.join(pwd, 'assets')));

app.use(async (ctx, next) => {
  const pageURL = ctx.query?.url as string|undefined
  if (pageURL) {
    const pageRes = await fetch(pageURL)
    const pageHtml = await pageRes.text()
    const doc = new JSDOM(pageHtml, {
      url: pageURL
    })
    const reader = new Readability(doc.window.document)
    const document = doc.window.document
    const ogImage = document.querySelector('[property="og:image"]')?.getAttribute('content')
    const article = reader.parse()
    ctx.body = template
      .replace(/{{\s*body\s*}}/g, article?.content)
      .replace(/{{\s*title\s*}}/g, article?.title)
      .replace(/{{\s*byline\s*}}/g, article?.byline || '')
      .replace(/{{\s*ogImage\s*}}/g, ogImage || '')
  } else {
    next()
  }
})

app.use(async (ctx, next) => {
  const filePath = ctx.path.slice(1)
  const resourcePath = path.join(pwd, filePath)
  if (filePath && fs.existsSync(resourcePath)) {
    ctx.body = fs.readFileSync(resourcePath, 'utf-8')
  } else {
    next()
  }
})

app.listen(8088)

