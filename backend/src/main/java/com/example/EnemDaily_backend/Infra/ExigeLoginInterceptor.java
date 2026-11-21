package com.example.EnemDaily_backend.Infra;

import com.example.EnemDaily_backend.model.Usuario;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class ExigeLoginInterceptor implements HandlerInterceptor, WebMvcConfigurer {

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) {
        if (!(handler instanceof HandlerMethod metodo)) return true;
        boolean precisa = Arrays.stream(metodo.getMethodParameters())
                .anyMatch(p -> Authentication.class.isAssignableFrom(p.getParameterType()));
        if (!precisa) return true;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Usuario) return true;
        resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        return false;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this);
    }
}
