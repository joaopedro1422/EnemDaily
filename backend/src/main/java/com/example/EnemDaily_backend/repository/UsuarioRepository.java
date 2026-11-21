package com.example.EnemDaily_backend.repository;

import com.example.EnemDaily_backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import javax.swing.text.html.Option;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsuario(String usuario);
    Optional<Usuario> findByEmail(String usuario);

   Optional<Usuario> findById(UUID uuid);

    @org.springframework.data.jpa.repository.Query("""
        select u from Usuario u
        where u.demo = false
          and (lower(u.usuario) like lower(concat(:q, '%')) or lower(u.nome) like lower(concat('%', :q, '%')))
        order by case when lower(u.usuario) like lower(concat(:q, '%')) then 0 else 1 end, length(u.usuario), u.usuario
    """)
    java.util.List<Usuario> buscar(@org.springframework.data.repository.query.Param("q") String q, org.springframework.data.domain.Pageable pagina);
}
