package com.example.EnemDaily_backend.Infra;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class AcessoAdmin {

    @Value("${enemdaily.admin.chave:}")
    private String chave;

    public boolean autorizado(String informada, HttpServletRequest req) {
        if (chave == null || chave.isBlank()) {
            boolean viaProxy = req.getHeader("X-Forwarded-For") != null || req.getHeader("Forwarded") != null;
            return !viaProxy && redeLocal(req.getRemoteAddr());
        }
        return informada != null && MessageDigest.isEqual(chave.getBytes(StandardCharsets.UTF_8), informada.getBytes(StandardCharsets.UTF_8));
    }

    private static boolean redeLocal(String ip) {
        try {
            InetAddress a = InetAddress.getByName(ip);
            return a.isLoopbackAddress() || a.isSiteLocalAddress() || a.isLinkLocalAddress();
        } catch (Exception e) {
            return false;
        }
    }
}
