package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.model.PushChaves;
import com.example.EnemDaily_backend.repository.PushChavesRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.interfaces.ECPublicKey;
import java.security.spec.*;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;

@Service
public class WebPushService {
    private static final SecureRandom ALEATORIO = new SecureRandom();
    private static final Base64.Encoder B64URL = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DEC_URL = Base64.getUrlDecoder();

    private final PushChavesRepository chavesRepository;
    private final String assunto;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    private ECParameterSpec curva;
    private PrivateKey privada;
    private String publicaB64;

    public WebPushService(PushChavesRepository chavesRepository, @Value("${push.assunto:mailto:enemdaily@gmail.com}") String assunto) {
        this.chavesRepository = chavesRepository;
        this.assunto = assunto;
    }

    @PostConstruct
    void carregarChaves() throws GeneralSecurityException {
        AlgorithmParameters ap = AlgorithmParameters.getInstance("EC");
        ap.init(new ECGenParameterSpec("secp256r1"));
        curva = ap.getParameterSpec(ECParameterSpec.class);
        PushChaves c = chavesRepository.findById(1).orElse(null);
        if (c == null) {
            KeyPair kp = novoPar();
            c = new PushChaves();
            c.setPublica(B64URL.encodeToString(cru((ECPublicKey) kp.getPublic())));
            c.setPrivada(Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded()));
            chavesRepository.save(c);
        }
        privada = KeyFactory.getInstance("EC").generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(c.getPrivada())));
        publicaB64 = c.getPublica();
    }

    public String chavePublica() { return publicaB64; }

    public int enviar(String endpoint, String p256dh, String auth, String json, int ttlSegundos) throws Exception {
        byte[] corpo = cifrar(json.getBytes(StandardCharsets.UTF_8), DEC_URL.decode(limpar(p256dh)), DEC_URL.decode(limpar(auth)));
        URI uri = URI.create(endpoint);
        String audiencia = uri.getScheme() + "://" + uri.getHost() + (uri.getPort() > 0 ? ":" + uri.getPort() : "");
        HttpRequest req = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(15))
                .header("TTL", String.valueOf(ttlSegundos))
                .header("Urgency", "normal")
                .header("Content-Encoding", "aes128gcm")
                .header("Content-Type", "application/octet-stream")
                .header("Authorization", "vapid t=" + jwt(audiencia) + ", k=" + publicaB64)
                .POST(HttpRequest.BodyPublishers.ofByteArray(corpo))
                .build();
        return http.send(req, HttpResponse.BodyHandlers.discarding()).statusCode();
    }


    private static String limpar(String b64) { return b64.trim().replace('+', '-').replace('/', '_').replace("=", ""); }

    private KeyPair novoPar() throws GeneralSecurityException {
        KeyPairGenerator g = KeyPairGenerator.getInstance("EC");
        g.initialize(new ECGenParameterSpec("secp256r1"), ALEATORIO);
        return g.generateKeyPair();
    }

    private static byte[] fixo(BigInteger v) {
        byte[] b = v.toByteArray();
        if (b.length == 32) return b;
        byte[] r = new byte[32];
        if (b.length > 32) System.arraycopy(b, b.length - 32, r, 0, 32);
        else System.arraycopy(b, 0, r, 32 - b.length, b.length);
        return r;
    }

    private static byte[] cru(ECPublicKey k) {
        return juntar(new byte[]{4}, fixo(k.getW().getAffineX()), fixo(k.getW().getAffineY()));
    }

    private PublicKey deCru(byte[] cru) throws GeneralSecurityException {
        if (cru.length != 65 || cru[0] != 4) throw new InvalidKeyException("Chave do navegador inválida.");
        ECPoint p = new ECPoint(new BigInteger(1, Arrays.copyOfRange(cru, 1, 33)), new BigInteger(1, Arrays.copyOfRange(cru, 33, 65)));
        return KeyFactory.getInstance("EC").generatePublic(new ECPublicKeySpec(p, curva));
    }

    private static byte[] hmac(byte[] chave, byte[] dados) throws GeneralSecurityException {
        Mac m = Mac.getInstance("HmacSHA256");
        m.init(new SecretKeySpec(chave, "HmacSHA256"));
        return m.doFinal(dados);
    }

    private static byte[] juntar(byte[]... partes) {
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        for (byte[] p : partes) o.writeBytes(p);
        return o.toByteArray();
    }

    byte[] cifrar(byte[] mensagem, byte[] publicaDoNavegador, byte[] segredo) throws GeneralSecurityException {
        KeyPair efemero = novoPar();
        byte[] publicaEfemera = cru((ECPublicKey) efemero.getPublic());
        KeyAgreement ka = KeyAgreement.getInstance("ECDH");
        ka.init(efemero.getPrivate());
        ka.doPhase(deCru(publicaDoNavegador), true);
        byte[] compartilhado = ka.generateSecret();

        byte[] prkChave = hmac(segredo, compartilhado);
        byte[] infoChave = juntar("WebPush: info".getBytes(StandardCharsets.US_ASCII), new byte[]{0}, publicaDoNavegador, publicaEfemera, new byte[]{1});
        byte[] ikm = Arrays.copyOf(hmac(prkChave, infoChave), 32);

        byte[] sal = new byte[16];
        ALEATORIO.nextBytes(sal);
        byte[] prk = hmac(sal, ikm);
        byte[] cek = Arrays.copyOf(hmac(prk, juntar("Content-Encoding: aes128gcm".getBytes(StandardCharsets.US_ASCII), new byte[]{0, 1})), 16);
        byte[] nonce = Arrays.copyOf(hmac(prk, juntar("Content-Encoding: nonce".getBytes(StandardCharsets.US_ASCII), new byte[]{0, 1})), 12);

        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(cek, "AES"), new GCMParameterSpec(128, nonce));
        byte[] cifrado = c.doFinal(juntar(mensagem, new byte[]{2}));

        byte[] cabecalho = juntar(sal, new byte[]{0, 0, 0x10, 0}, new byte[]{(byte) publicaEfemera.length}, publicaEfemera);
        return juntar(cabecalho, cifrado);
    }

    private String jwt(String audiencia) throws GeneralSecurityException {
        String cab = B64URL.encodeToString("{\"typ\":\"JWT\",\"alg\":\"ES256\"}".getBytes(StandardCharsets.UTF_8));
        long exp = Instant.now().plusSeconds(12 * 3600).getEpochSecond();
        String dados = B64URL.encodeToString(("{\"aud\":\"" + audiencia + "\",\"exp\":" + exp + ",\"sub\":\"" + assunto + "\"}").getBytes(StandardCharsets.UTF_8));
        Signature s = Signature.getInstance("SHA256withECDSAinP1363Format");
        s.initSign(privada);
        s.update((cab + "." + dados).getBytes(StandardCharsets.US_ASCII));
        return cab + "." + dados + "." + B64URL.encodeToString(s.sign());
    }
}
