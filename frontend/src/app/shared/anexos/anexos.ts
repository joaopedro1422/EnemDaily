/** Regras dos anexos de redação: até 3 fotos ou 1 PDF. Os mesmos limites são conferidos no backend. */
export const MAX_FOTOS = 3;
export const MAX_FOTO_ORIGINAL = 25 * 1024 * 1024;
export const MAX_PDF = 10 * 1024 * 1024;
const LADO_MAX = 2000;
const ALVO = 700 * 1024;

export interface ArquivoPreparado { blob: Blob; nome: string; tipo: string; tamanho: number; previa: string | null; }

export function ehPdf(f: { type: string; name?: string }): boolean {
  return f.type === 'application/pdf' || (!!f.name && /\.pdf$/i.test(f.name) && !f.type);
}

export function tamanhoLegivel(b: number): string {
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  return `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

/** Confere o arquivo e, se for foto, reduz no próprio aparelho para algo perto de 500 KB. Lança Error com a mensagem para o aluno. */
export async function prepararArquivo(f: File): Promise<ArquivoPreparado> {
  if (ehPdf(f)) {
    if (f.size > MAX_PDF) throw new Error(`O PDF tem ${tamanhoLegivel(f.size)}. O limite é 10 MB.`);
    return { blob: f, nome: f.name || 'redacao.pdf', tipo: 'application/pdf', tamanho: f.size, previa: null };
  }
  if (!f.type.startsWith('image/')) throw new Error('Envie fotos (JPG, PNG, HEIC) ou um PDF.');
  if (f.size > MAX_FOTO_ORIGINAL) throw new Error('Essa foto é grande demais. Tente outra com resolução menor.');
  const blob = await comprimirFoto(f);
  const nome = (f.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg';
  return { blob, nome, tipo: 'image/jpeg', tamanho: blob.size, previa: URL.createObjectURL(blob) };
}

async function carregar(f: File): Promise<CanvasImageSource & { width: number; height: number }> {
  try {
    return await createImageBitmap(f, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(f);
    try {
      return await new Promise<HTMLImageElement>((ok, falha) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = () => falha(new Error('Não deu para abrir essa foto. Tente tirar de novo ou enviar em JPG.'));
        img.src = url;
      });
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
}

export async function comprimirFoto(f: File): Promise<Blob> {
  const img = await carregar(f);
  const k = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * k);
  canvas.height = Math.round(img.height * k);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if ('close' in img && typeof (img as ImageBitmap).close === 'function') (img as ImageBitmap).close();
  let blob: Blob | null = null;
  for (const q of [.74, .62, .5]) {
    blob = await new Promise<Blob | null>(ok => canvas.toBlob(b => ok(b), 'image/jpeg', q));
    if (blob && blob.size <= ALVO) break;
  }
  if (!blob) throw new Error('Não deu para preparar essa foto.');
  return blob;
}
