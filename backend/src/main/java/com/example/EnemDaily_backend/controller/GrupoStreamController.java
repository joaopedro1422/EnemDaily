package com.example.EnemDaily_backend.controller;

import com.example.EnemDaily_backend.service.GrupoStreamService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

@RestController
@RequestMapping("/gruposStream")
public class GrupoStreamController {
    private final GrupoStreamService streamService;

    public GrupoStreamController(GrupoStreamService streamService) {
        this.streamService = streamService;
    }

    @GetMapping(value = "/{grupoId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable UUID grupoId) {
        return streamService.subscribe(grupoId);
    }
}
