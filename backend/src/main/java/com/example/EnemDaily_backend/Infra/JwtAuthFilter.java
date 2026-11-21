package com.example.EnemDaily_backend.Infra;

import com.example.EnemDaily_backend.model.Usuario;
import com.example.EnemDaily_backend.repository.UsuarioRepository;
import com.example.EnemDaily_backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();
        if (token.isBlank() || token.chars().filter(ch -> ch == '.').count() != 2) {
            filterChain.doFilter(request, response);
            return;
        }

        UUID id;
        try {
            id = jwtService.getUserId(token);
        } catch (RuntimeException e) {
            id = null;
        }

        if (id != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            usuarioRepository.findById(id).ifPresent(usuario ->
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(usuario, null, List.of())));
        }
        filterChain.doFilter(request, response);
    }


}
