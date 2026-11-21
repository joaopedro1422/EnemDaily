// Gera HTML pronto para o Google das páginas de conteúdo, mais sitemap.xml e robots.txt.
// Roda depois do `ng build` (veja o script build:vercel). Variáveis:
//   API_URL  endereço do backend (ex.: https://api.enemdaily.com.br)
//   SITE_URL endereço público do site (ex.: https://enemdaily.com.br)
// Se a API não responder, o build continua sem as páginas estáticas (o app funciona normalmente).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const SAIDA = 'dist/enem-daily/browser';
const API = (process.env.API_URL || '').replace(/\/$/, '');
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const AREAS = { linguagens: 'Linguagens, Códigos e suas Tecnologias', humanas: 'Ciências Humanas e suas Tecnologias', natureza: 'Ciências da Natureza e suas Tecnologias', matematica: 'Matemática e suas Tecnologias' };

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function json(caminho) {
  const r = await fetch(API + caminho, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status}`);
  return r.json();
}

function pagina(base, { titulo, descricao, caminho, jsonLd, corpo }) {
  const url = SITE + caminho;
  const cabeca = [
    `<title>${esc(titulo)} | enem.daily</title>`,
    `<meta name="description" content="${esc(descricao)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:title" content="${esc(titulo)}">`,
    `<meta property="og:description" content="${esc(descricao)}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:url" content="${esc(url)}">`,
    jsonLd ? `<script type="application/ld+json" id="ld-conteudo">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''
  ].join('\n    ');
  return base
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta name="description"[^>]*>/i, '')
    .replace('</head>', `    ${cabeca}\n  </head>`)
    .replace(/<app-root>[\s\S]*?<\/app-root>/i, `<app-root>${corpo}</app-root>`);
}

function artigo(p) {
  const rel = (p.relacionados || []).map(r => `<li><a href="/conteudos/${r.area}/${r.slug}">${esc(r.assunto)}</a></li>`).join('');
  return `<main><article>
<nav><a href="/conteudos">Conteúdos</a> › ${esc(AREAS[p.area] || '')}</nav>
<h1>${esc(p.titulo || p.assunto)}</h1>
<p>${esc(p.seoDescricao || '')}</p>
<section><h2>Resumo</h2>${p.resumo || ''}</section>
<section><h2>Como cai no ENEM</h2>${p.comoCai || ''}</section>
${p.paraNaoErrar ? `<section><h2>Para não errar</h2>${p.paraNaoErrar}</section>` : ''}
${rel ? `<nav><h2>Outros conteúdos</h2><ul>${rel}</ul></nav>` : ''}
</article></main>`;
}

async function gravar(caminho, html) {
  const pasta = join(SAIDA, caminho);
  await mkdir(pasta, { recursive: true });
  await writeFile(join(pasta, 'index.html'), html, 'utf8');
}

async function main() {
  const base = await readFile(join(SAIDA, 'index.html'), 'utf8');
  const urls = [{ loc: '/', lastmod: null }, { loc: '/conteudos', lastmod: null }];
  if (!API || !SITE) {
    console.warn('[prerender] API_URL ou SITE_URL não definidos: pulando as páginas de conteúdo.');
  } else {
    try {
      const lista = await json('/conteudos');
      for (const c of lista) {
        const p = await json(`/conteudos/${c.area}/${c.slug}`);
        const caminho = `/conteudos/${p.area}/${p.slug}`;
        await gravar(caminho, pagina(base, {
          titulo: p.seoTitulo || p.titulo || p.assunto,
          descricao: p.seoDescricao || '',
          caminho,
          jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: p.titulo || p.assunto, description: p.seoDescricao || '', inLanguage: 'pt-BR', about: p.assunto, educationalLevel: 'Ensino médio', dateModified: p.atualizadoEm, datePublished: p.publicadoEm, mainEntityOfPage: SITE + caminho, publisher: { '@type': 'Organization', name: 'enem.daily' } },
          corpo: artigo(p)
        }));
        urls.push({ loc: caminho, lastmod: p.atualizadoEm });
      }
      const itens = lista.map(c => `<li><a href="/conteudos/${c.area}/${c.slug}">${esc(c.assunto)}</a> — ${esc(c.descricao)}</li>`).join('');
      await gravar('/conteudos', pagina(base, {
        titulo: 'Conteúdos para o ENEM: resumos e como cada assunto cai na prova',
        descricao: 'Resumos de cada assunto do ENEM, explicando como o tema cai na prova e os erros mais comuns, com questões inéditas para treinar.',
        caminho: '/conteudos',
        corpo: `<main><h1>Os assuntos do ENEM, do jeito que caem na prova</h1><ul>${itens}</ul></main>`
      }));
      console.log(`[prerender] ${lista.length} páginas de conteúdo geradas.`);
    } catch (e) {
      console.warn('[prerender] Não foi possível buscar os conteúdos:', e.message);
    }
  }
  if (SITE) {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(SITE + u.loc)}</loc>${u.lastmod ? `<lastmod>${String(u.lastmod).slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
    await writeFile(join(SAIDA, 'sitemap.xml'), sitemap, 'utf8');
  }
  await writeFile(join(SAIDA, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\n${SITE ? `Sitemap: ${SITE}/sitemap.xml\n` : ''}`, 'utf8');
}

main().catch(e => { console.error('[prerender] Falhou:', e); process.exit(0); });
