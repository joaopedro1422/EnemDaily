package com.example.EnemDaily_backend.Infra;

import jakarta.servlet.Filter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/grupos/**").permitAll()
                        .requestMatchers("/gruposStream/**").permitAll()
                        .requestMatchers("/usuarios/**").permitAll()
                        .requestMatchers("/api/questoes/**").permitAll()
                        .requestMatchers("/api/assuntos/**").permitAll()
                        .requestMatchers("/simulados/**").permitAll()
                        .requestMatchers("/redacoes/**").permitAll()
                        .requestMatchers("/comunidade/**").permitAll()
                        .requestMatchers("/duelos/**").permitAll()
                        .requestMatchers("/push/**").permitAll()
                        .requestMatchers("/admin/**").permitAll()
                        .requestMatchers("/conteudos/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


}
