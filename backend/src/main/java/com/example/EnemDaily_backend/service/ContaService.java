package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.DTO.UsuarioResponseDTO;
import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class ContaService {

    public static class RegraConta extends RuntimeException {
        public RegraConta(String msg) { super(msg); }
    }

    private static final Pattern FORMATO_USUARIO = Pattern.compile("^[a-z0-9._]{3,20}$");
    private static final Pattern FORMATO_EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");

    private final UsuarioRepository usuarios;
    private final UsuarioService usuarioService;
    private final PasswordEncoder encoder;
    private final JdbcTemplate jdbc;

    public ContaService(UsuarioRepository usuarios, UsuarioService usuarioService, PasswordEncoder encoder, JdbcTemplate jdbc) {
        this.usuarios = usuarios;
        this.usuarioService = usuarioService;
        this.encoder = encoder;
        this.jdbc = jdbc;
    }

    public Map<String, Object> disponibilidade(String usuario, Usuario eu) {
        String u = normalizarUsuario(usuario);
        if (!FORMATO_USUARIO.matcher(u).matches()) {
            return Map.of("disponivel", false, "motivo", "Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou sublinhado.");
        }
        if (u.equals(eu.getUsuario())) return Map.of("disponivel", true, "atual", true);
        boolean livre = usuarios.findByUsuario(u).isEmpty();
        return livre ? Map.of("disponivel", true) : Map.of("disponivel", false, "motivo", "Esse nome de usuário já está em uso.");
    }

    @Transactional
    public UsuarioResponseDTO alterarNome(Usuario eu, String nome) {
        String n = nome == null ? "" : nome.trim().replaceAll("\\s+", " ");
        if (n.length() < 2 || n.length() > 60) throw new RegraConta("O nome precisa ter entre 2 e 60 caracteres.");
        eu.setNome(n);
        usuarios.save(eu);
        return usuarioService.getUsuarioResponseDTO(eu);
    }

    @Transactional
    public UsuarioResponseDTO alterarUsuario(Usuario eu, String usuario) {
        String u = normalizarUsuario(usuario);
        if (!FORMATO_USUARIO.matcher(u).matches()) throw new RegraConta("Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou sublinhado.");
        if (u.equals(eu.getUsuario())) return usuarioService.getUsuarioResponseDTO(eu);
        if (usuarios.findByUsuario(u).isPresent()) throw new RegraConta("Esse nome de usuário já está em uso.");
        String antigo = eu.getUsuario();
        eu.setUsuario(u);
        usuarios.save(eu);
        if (antigo != null) jdbc.update("update atividades_recentes set usuario = ? where usuario = ?", u, antigo);
        return usuarioService.getUsuarioResponseDTO(eu);
    }

    @Transactional
    public UsuarioResponseDTO alterarEmail(Usuario eu, String email, String senhaAtual) {
        conferirSenha(eu, senhaAtual);
        String e = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (!FORMATO_EMAIL.matcher(e).matches()) throw new RegraConta("Digite um e-mail válido.");
        if (e.equalsIgnoreCase(eu.getEmail())) return usuarioService.getUsuarioResponseDTO(eu);
        if (usuarios.findByEmail(e).isPresent()) throw new RegraConta("Esse e-mail já está cadastrado em outra conta.");
        eu.setEmail(e);
        usuarios.save(eu);
        return usuarioService.getUsuarioResponseDTO(eu);
    }

    @Transactional
    public void alterarSenha(Usuario eu, String senhaAtual, String novaSenha) {
        conferirSenha(eu, senhaAtual);
        if (novaSenha == null || novaSenha.length() < 8) throw new RegraConta("A nova senha precisa ter pelo menos 8 caracteres.");
        if (encoder.matches(novaSenha, eu.getSenha())) throw new RegraConta("A nova senha precisa ser diferente da atual.");
        eu.setSenha(encoder.encode(novaSenha));
        usuarios.save(eu);
    }

    private void conferirSenha(Usuario eu, String senha) {
        if (senha == null || !encoder.matches(senha, eu.getSenha())) throw new RegraConta("Senha atual incorreta.");
    }

    private static String normalizarUsuario(String u) {
        return u == null ? "" : u.trim().replaceFirst("^@", "").toLowerCase(Locale.ROOT);
    }
}
