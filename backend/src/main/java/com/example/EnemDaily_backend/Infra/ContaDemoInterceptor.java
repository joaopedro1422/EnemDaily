package com.example.EnemDaily_backend.Infra;

import com.example.EnemDaily_backend.model.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Configuration
public class ContaDemoInterceptor implements HandlerInterceptor, WebMvcConfigurer {

    private static final Set<String> LEITURA = Set.of("GET", "HEAD", "OPTIONS");
    private static final List<Pattern> PERMITIDAS = List.of(
            Pattern.compile("^/usuarios/resposta$"),
            Pattern.compile("^/usuarios/onboarding-visto$"),
            Pattern.compile("^/duelos/[^/]+/visto$"),
            Pattern.compile("^/push/remover$"));

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) throws IOException {
        if (LEITURA.contains(req.getMethod())) return true;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Usuario u) || !u.isDemo()) return true;
        String caminho = req.getRequestURI().substring(req.getContextPath().length());
        if (PERMITIDAS.stream().anyMatch(p -> p.matcher(caminho).matches())) return true;
        resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
        resp.setContentType("application/json;charset=UTF-8");
        resp.getWriter().write("{\"erro\":\"conta_demo\",\"mensagem\":\"Na conta demonstrativa essa ação fica desativada.\"}");
        return false;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this);
    }
}
