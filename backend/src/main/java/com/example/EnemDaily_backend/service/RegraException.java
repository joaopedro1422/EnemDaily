package com.example.EnemDaily_backend.service;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class RegraException extends RuntimeException {
    private final HttpStatus status;

    public RegraException(HttpStatus status, String mensagem) {
        super(mensagem);
        this.status = status;
    }
}
