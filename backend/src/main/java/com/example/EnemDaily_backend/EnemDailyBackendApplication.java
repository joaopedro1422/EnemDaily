package com.example.EnemDaily_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@EnableCaching
public class EnemDailyBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EnemDailyBackendApplication.class, args);
	}

}
