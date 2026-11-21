/**
 * A arte (HTML/CSS) vira PNG no navegador com o html-to-image (import dinâmico: só carrega ao baixar ou compartilhar).
 * As fontes do Google entram embutidas na imagem (sem elas a imagem sai com a fonte padrão do aparelho): os @font-face
 * vêm do CSS da página e os arquivos .woff2 viram data URLs (só os subconjuntos latinos das famílias que a arte usa).
 * As fotos já chegam em data URL (PostsService.imagem), então nada depende de CORS na hora de desenhar.
 *
 * O CSS das fontes muda de lugar conforme o build: no `npm start` é o <link> do index.html; no build de produção o
 * Angular troca o link por um <style> com o CSS já baixado e SEM os comentários que marcam o subconjunto (latin,
 * latin-ext...). Por isso os blocos são lidos dos dois lugares e o subconjunto é reconhecido pelo unicode-range.
 * Família que não aparecer em nenhum dos dois é buscada direto no Google Fonts.
 */

const cssBaixado = new Map<string, Promise<string>>();
const arquivosDeFonte = new Map<string, Promise<string>>();

/** "'Playfair Display', serif" -> "Playfair Display" */
export function nomeDaFamilia(fonteCss: string): string {
  return fonteCss.split(',')[0].replace(/['"]/g, '').trim();
}

function baixarCss(href: string): Promise<string> {
  if (!cssBaixado.has(href)) {
    cssBaixado.set(href, fetch(href).then((r) => (r.ok ? r.text() : '')).catch(() => ''));
  }
  return cssBaixado.get(href)!;
}

function arquivoComoDataUrl(url: string): Promise<string> {
  if (!arquivosDeFonte.has(url)) {
    const pedido = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Fonte não encontrada: ${url}`);
        return r.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolver, rejeitar) => {
            const leitor = new FileReader();
            leitor.onload = () => resolver(String(leitor.result));
            leitor.onerror = () => rejeitar(leitor.error);
            leitor.readAsDataURL(blob);
          }),
      );
    // falhou: tenta de novo na próxima exportação
    pedido.catch(() => arquivosDeFonte.delete(url));
    arquivosDeFonte.set(url, pedido);
  }
  return arquivosDeFonte.get(url)!;
}

/** Todo o CSS de fontes do Google que a página tem: os <link> (desenvolvimento) e os <style> inline (produção). */
async function cssDaPagina(): Promise<string> {
  const links = [...document.querySelectorAll<HTMLLinkElement>('link[href*="fonts.googleapis.com/css"]')].map((link) => link.href);
  const inline = [...document.querySelectorAll('style')]
    .map((estilo) => estilo.textContent ?? '')
    .filter((texto) => texto.includes('@font-face') && texto.includes('fonts.gstatic.com'));
  return [...(await Promise.all(links.map(baixarCss))), ...inline].join('\n');
}

function familiaDoBloco(bloco: string): string | undefined {
  return /font-family:\s*['"]?([^;'"]+)/.exec(bloco)?.[1]?.trim();
}

/** latin (U+0000-00FF...) e latin-ext (U+0100-02BA...); bloco sem unicode-range = o arquivo inteiro. */
function ehLatino(bloco: string): boolean {
  const faixa = /unicode-range:\s*([^;}]+)/.exec(bloco)?.[1];
  return !faixa || /U\+0000-00FF/i.test(faixa) || /^\s*U\+0100-/i.test(faixa);
}

function blocosLatinos(css: string, familias: string[]): string[] {
  return [...css.matchAll(/@font-face\s*\{[^}]*\}/g)]
    .map(([bloco]) => bloco)
    .filter((bloco) => familias.includes(familiaDoBloco(bloco) ?? '') && ehLatino(bloco));
}

/** A família direto do Google Fonts (com os pesos usados nas artes; a que só tem um peso vem sem eles). */
async function cssDoGoogle(familia: string): Promise<string> {
  const nome = encodeURIComponent(familia).replace(/%20/g, '+');
  const comPesos = await baixarCss(`https://fonts.googleapis.com/css2?family=${nome}:wght@400;500;600;700&display=swap`);
  return comPesos || baixarCss(`https://fonts.googleapis.com/css2?family=${nome}&display=swap`);
}

/** O @font-face (com os arquivos embutidos) das famílias usadas na arte. */
async function cssDasFontes(familias: string[]): Promise<string> {
  const blocos = blocosLatinos(await cssDaPagina(), familias);
  const faltando = familias.filter((familia) => !blocos.some((bloco) => familiaDoBloco(bloco) === familia));
  for (const familia of faltando) {
    blocos.push(...blocosLatinos(await cssDoGoogle(familia), [familia]));
  }
  const unicos = [...new Set(blocos)];
  const embutidos = await Promise.all(
    unicos.map(async (bloco) => {
      const url = /url\(([^)]+)\)/.exec(bloco)?.[1]?.replace(/['"]/g, '');
      if (!url || url.startsWith('data:')) return bloco;
      return bloco.replace(url, await arquivoComoDataUrl(url));
    }),
  );
  return embutidos.join('\n');
}

/** A arte em PNG, no tamanho real (1080 px de largura). */
export async function gerarPng(elemento: HTMLElement, largura: number, altura: number, familias: string[]): Promise<Blob> {
  const [{ toSvg }, fontEmbedCSS] = await Promise.all([import('html-to-image'), cssDasFontes(familias)]);
  await document.fonts.ready;
  const opcoes = {
    width: largura,
    height: altura,
    pixelRatio: 1,
    fontEmbedCSS,
    // a prévia está reduzida por transform: a imagem sai sem ela, no tamanho real
    style: { transform: 'none', left: '0', top: '0' },
  };
  // a arte vira um SVG (com as fontes e fotos embutidas) e o SVG é desenhado num canvas do tamanho real
  const imagem = await carregarImagem(await toSvg(elemento, opcoes));
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const contexto = canvas.getContext('2d');
  if (!contexto) {
    throw new Error('Não foi possível gerar a imagem.');
  }
  // o Safari (iPhone) carrega as fontes de dentro do SVG depois do "load": a mesma imagem é desenhada algumas vezes,
  // com intervalo, e a última sai com as fontes (desenhar uma vez só pode sair com a fonte padrão do aparelho)
  for (let vez = 0; vez < DESENHOS; vez++) {
    contexto.clearRect(0, 0, largura, altura);
    contexto.drawImage(imagem, 0, 0, largura, altura);
    await esperar(INTERVALO_ENTRE_DESENHOS_MS);
  }
  const blob = await new Promise<Blob | null>((resolver) => canvas.toBlob(resolver, 'image/png'));
  if (!blob) {
    throw new Error('Não foi possível gerar a imagem.');
  }
  return blob;
}

const DESENHOS = 4;
const INTERVALO_ENTRE_DESENHOS_MS = 150;

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function carregarImagem(src: string): Promise<HTMLImageElement> {
  const imagem = new Image();
  imagem.decoding = 'sync';
  await new Promise<void>((resolver, rejeitar) => {
    imagem.onload = () => resolver();
    imagem.onerror = () => rejeitar(new Error('Não foi possível desenhar a arte.'));
    imagem.src = src;
  });
  await imagem.decode().catch(() => undefined);
  return imagem;
}

export function baixarArquivo(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** No celular, abre o compartilhamento do sistema (Instagram, WhatsApp...) com a imagem. false = não suportado. */
export async function compartilharArquivo(blob: Blob, nome: string, texto: string): Promise<boolean> {
  const arquivo = new File([blob], nome, { type: 'image/png' });
  if (!navigator.canShare?.({ files: [arquivo] })) {
    return false;
  }
  try {
    await navigator.share({ files: [arquivo], text: texto });
  } catch (erro) {
    // o usuário fechou o compartilhamento: não é erro
    if ((erro as DOMException)?.name !== 'AbortError') throw erro;
  }
  return true;
}
