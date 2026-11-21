package com.example.EnemDaily_backend.model;

import com.example.EnemDaily_backend.Enum.EventType;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private UUID idUsuario;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType tipo;

    @Column(nullable = false)
    private LocalDateTime data;

    @Type(JsonBinaryType.class)
    @Column(name = "json_context", columnDefinition = "jsonb")
    private Map<String, Object> jsonContext;
}
