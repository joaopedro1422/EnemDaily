package com.example.EnemDaily_backend.service;

import com.example.EnemDaily_backend.model.Usuario;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String privateKey;
    public String generateToken(Usuario usuario) {
        return Jwts.builder()
                .setSubject(usuario.getId().toString())
                .setIssuedAt(new Date())
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public UUID getUserId(String token) {
        return UUID.fromString(
                Jwts.parserBuilder()
                        .setSigningKey(getSignKey())
                        .build()
                        .parseClaimsJws(token)
                        .getBody()
                        .getSubject()
        );
    }
    private Key getSignKey() {
        return Keys.hmacShaKeyFor(privateKey.getBytes(StandardCharsets.UTF_8));
    }
}
