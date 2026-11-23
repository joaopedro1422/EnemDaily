package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.*;
import com.example.EnemDaily_backend.Enum.AreaEnum;
import com.example.EnemDaily_backend.model.GrupoUsuario;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.EventRepository;
import com.example.EnemDaily_backend.repository.GrupoUsuarioRepository;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UsuarioRepository usuarioRepository;
    private final GrupoUsuarioRepository grupoUsuarioRepository;
    private final GrupoService grupoService;
    private final UsuarioService usuarioService;
    private final EventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JavaMailSender javaMailSender;

    private record CodigoPendente(String hash, Instant expira, int tentativas) {}
    private static final Duration VALIDADE_CODIGO = Duration.ofMinutes(15);
    private static final int MAX_TENTATIVAS = 5;
    private final SecureRandom aleatorio = new SecureRandom();
    private final Map<String, CodigoPendente> codigos = new ConcurrentHashMap<>();

    public void processarRecuperacao(String email){
        String chave = normalizar(email);
        usuarioRepository.findByEmail(chave)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        CodigoPendente anterior = codigos.get(chave);
        if (anterior != null && anterior.expira().minus(VALIDADE_CODIGO).plusSeconds(60).isAfter(Instant.now())) {
            throw new RuntimeException("Aguarde um minuto para pedir outro código.");
        }
        String codigo = String.format("%06d", aleatorio.nextInt(1_000_000));
        codigos.put(chave, new CodigoPendente(passwordEncoder.encode(codigo), Instant.now().plus(VALIDADE_CODIGO), 0));
        enviarEmail(chave, codigo);
    }

    public boolean codigoValido(String email, String codigo){
        String chave = normalizar(email);
        CodigoPendente p = codigos.get(chave);
        if (p == null || p.expira().isBefore(Instant.now()) || p.tentativas() >= MAX_TENTATIVAS) {
            codigos.remove(chave);
            return false;
        }
        if (codigo != null && passwordEncoder.matches(codigo, p.hash())) return true;
        codigos.put(chave, new CodigoPendente(p.hash(), p.expira(), p.tentativas() + 1));
        return false;
    }

    public void salvaNovaSenha(NovaSenhaRequest request){
        String chave = normalizar(request.email());
        if (!codigoValido(chave, request.codigo())) throw new RuntimeException("Código inválido ou expirado.");
        if (request.senha() == null || !request.senha().matches("^(?=.*\\d)\\S{6,}$")) throw new RuntimeException("A senha precisa ter pelo menos 6 caracteres e um número.");
        Usuario usuario = usuarioRepository.findByEmail(chave)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        usuario.setSenha(passwordEncoder.encode(request.senha()));
        usuario.setTokenSessao(null);
        usuarioRepository.save(usuario);
        codigos.remove(chave);
    }

    private static String normalizar(String email){
        return email == null ? "" : email.trim().toLowerCase();
    }

    private void enviarEmail(String destinatario, String codigo) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("Enemdaily@gmail.com");
            helper.setTo(destinatario);
            helper.setSubject("Recuperação de Senha - Código de Acesso");

            String htmlContent = "<html>" +
                    "<body style='margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;'>" +
                    "<table width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #f4f4f4; padding: 20px;'>" +
                    "<tr>" +
                    "<td align='center'>" +
                    "<table width='600' border='0' cellspacing='0' cellpadding='0' style='background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>" +
                    "<tr>" +
                    "<td align='center' style='padding-bottom: 30px;'>" +
                    "<img src='https://firebasestorage.googleapis.com/v0/b/enemdaily.firebasestorage.app/o/perfil-grupo%2F97413204-c43c-4e2d-a931-36b95723a850.png?alt=media&token=5aabb0c5-f37a-4c85-94b2-d42f7596b09c' alt='Logo Projeto' width='150' style='display: block;'>" +
                    "</td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td align='center' style='color: #333333; font-size: 24px; font-weight: bold; padding-bottom: 10px;'>" +
                    "Recuperação de Senha" +
                    "</td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td align='center' style='color: #666666; font-size: 16px; line-height: 1.5; padding-bottom: 30px;'>" +
                    "Olá! Recebemos uma solicitação de recuperação de senha. <br> Use o código abaixo para prosseguir:" +
                    "</td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td align='center' style='padding-bottom: 30px;'>" +
                    "<span style='background-color: #f8f9fa; border: 1px dashed #ced4da; padding: 15px 30px; font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;'>" +
                    codigo +
                    "</span>" +
                    "</td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td align='center' style='color: #999999; font-size: 12px;'>" +
                    "Se você não solicitou esta alteração, ignore este e-mail." +
                    "</td>" +
                    "</tr>" +
                    "</table>" +
                    "</td>" +
                    "</tr>" +
                    "</table>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);

            javaMailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Falha ao enviar e-mail de recuperação", e);
        }
    }
    public AuthResponseDTO register(UsuarioRequestDTO dto) {
        Usuario usuario = new Usuario(dto);
        usuario.setSenha(passwordEncoder.encode(dto.senha()));
        usuario = usuarioRepository.save(usuario);
        String token = jwtService.generateToken(usuario);
        usuario.setTokenSessao(token);
        usuarioRepository.save(usuario);
        UUID idGrupo = UUID.fromString("16599b34-57a9-41e3-b1cb-eb255671c3f1");
        grupoService.addUsuarioGrupo(usuario.getId(), idGrupo);
        usuarioRepository.flush();
        return new AuthResponseDTO(
                token,
                usuarioService.getUsuarioResponseDTO(usuario)
        );
    }

    public boolean existeUsuarioEmail(String email){
        Optional<Usuario> usuarioEncontrado = usuarioRepository.findByEmail(email.toLowerCase());
        return usuarioEncontrado.isPresent();
    }

    public boolean existeUsuario(String usuario){
        Optional<Usuario> usuarioEncontrado = usuarioRepository.findByUsuario(usuario.toLowerCase());
        return usuarioEncontrado.isPresent();
    }
    public List<XpAnoAreasDTO> getXpAnoAtual(UUID usuarioId) {
        return eventRepository.xpPorMesAnoAtual(usuarioId).stream()
                .map(r -> new XpAnoAreasDTO(
                        ((Number) r[0]).intValue(),
                        ((Number) r[1]).intValue(),
                        ((Number) r[2]).intValue(),
                        ((Number) r[3]).intValue(),
                        ((Number) r[4]).intValue()
                ))
                .toList();
    }
    public AuthResponseDTO login(LoginRequestDTO dto) {
        Usuario usuario = usuarioRepository
                .findByEmail(dto.email())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        if (!passwordEncoder.matches(dto.senha(), usuario.getSenha())) {
            throw new RuntimeException("Senha invalida");
        }
        String token = jwtService.generateToken(usuario);
        usuario.setTokenSessao(token);
        usuarioRepository.save(usuario);
        setAreasRespondidasHoje(usuario);
        return new AuthResponseDTO(
                token,
                usuarioService.getUsuarioResponseDTO(usuario)
        );
    }
    public int getDiasAtivos(UUID usuarioId) {
        return (int) eventRepository.contarDiasAtivos(usuarioId);
    }
    private void setAreasRespondidasHoje(Usuario usuario) {
        List<AreaEnum> areas = eventRepository.areasRespondidasHoje(usuario.getId());

        usuario.setNatRespondidaHj(areas.contains(AreaEnum.NATUREZAS));
        usuario.setHumRespondidaHj(areas.contains(AreaEnum.HUMANAS));
        usuario.setLingRespondidaHj(areas.contains(AreaEnum.LINGUAGENS));
        usuario.setExatRespondidaHj(areas.contains(AreaEnum.EXATAS));
    }

}
