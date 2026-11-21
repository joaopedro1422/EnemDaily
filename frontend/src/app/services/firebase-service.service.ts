import { Injectable } from '@angular/core';
import { getStorage, ref, listAll, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
@Injectable({
  providedIn: 'root'
})
export class FirebaseServiceService {

  constructor() { }

  async salvaImagem(file : File, nomeGrupo: string) : Promise<string>{
    const storage = getStorage();
    const path = `perfil-grupo/${nomeGrupo}`;
    const storageRef = ref(storage, path);
      try {
        await uploadBytes(storageRef, file); 
        const url = await getDownloadURL(storageRef); 
        return url;
      } catch (error) {
        console.error("Erro ao enviar imagem:", error);
        throw error;
      }
  }

  async salvaFotoPerfil(foto: Blob, idUsuario: string, caminhoAntigo = ''): Promise<{ caminho: string; token: string }> {
    const storage = getStorage();
    const extensao = foto.type === 'image/webp' ? 'webp' : 'jpg';
    const caminho = `avatares/${idUsuario}-${Date.now()}.${extensao}`;
    const storageRef = ref(storage, caminho);
    await uploadBytes(storageRef, foto, { contentType: foto.type, cacheControl: 'public,max-age=31536000' });
    const url = await getDownloadURL(storageRef);
    const token = new URL(url).searchParams.get('token') ?? '';
    if (caminhoAntigo && caminhoAntigo !== caminho) this.apagaFotoPerfil(caminhoAntigo);
    return { caminho, token };
  }

  async apagaFotoPerfil(caminho: string): Promise<void> {
    if (!caminho.startsWith('avatares/')) return;
    try { await deleteObject(ref(getStorage(), caminho)); } catch (e) { console.warn('Não deu para apagar a foto antiga:', e); }
  }

  async apagaFotosDoUsuario(idUsuario: string, caminhoAtual = ''): Promise<number> {
    const caminhos = new Set<string>();
    if (caminhoAtual.startsWith('avatares/')) caminhos.add(caminhoAtual);
    try {
      const lista = await listAll(ref(getStorage(), 'avatares'));
      lista.items.filter(i => i.name.startsWith(`${idUsuario}-`)).forEach(i => caminhos.add(i.fullPath));
    } catch (e) {
      console.warn('Não deu para listar as fotos do usuário:', e);
    }
    let apagadas = 0;
    for (const c of caminhos) {
      try { await deleteObject(ref(getStorage(), c)); apagadas++; } catch (e: any) {
        if (e?.code !== 'storage/object-not-found') console.warn('Não deu para apagar a foto', c, e);
      }
    }
    return apagadas;
  }

  async getImagemUniversidadeUrl(estagio: string): Promise<string>{
      const storage = getStorage();
      const path = `estagio-progresso/${estagio}.png`;
      const storageRef = ref(storage, path);
      try {
        const url = await getDownloadURL(storageRef);
        return url;
      } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
          console.warn("Imagem não encontrada no Storage.");
          return 'assets/imagem-padrao.png'; 
        }
        console.error("Erro ao buscar URL da imagem:", error);
        throw error;
      }
  }


}
