package com.example.todobackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS configuration for allowing frontend access from different origins.
 * Configured to support Angular development server on localhost:4200.
 * Enhanced for Feature 03 with development-specific optimizations.
 */
@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:http://localhost:4200}")
    private String allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${cors.allowed-headers:*}")
    private String allowedHeaders;

    /**
     * Standard CORS configuration for production and general use.
     * @return CorsConfigurationSource with configured settings
     */
    @Bean
    @Profile("!dev")
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Parse comma-separated origins
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        
        // Parse comma-separated methods
        List<String> methods = Arrays.asList(allowedMethods.split(","));
        configuration.setAllowedMethods(methods);
        
        // Parse comma-separated headers
        List<String> headers = Arrays.asList(allowedHeaders.split(","));
        configuration.setAllowedHeaders(headers);
        
        // Allow credentials for authentication
        configuration.setAllowCredentials(true);
        
        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    /**
     * Development-specific CORS configuration with enhanced permissions.
     * Supports multiple Angular dev server ports and additional debugging headers.
     * @return CorsConfigurationSource optimized for frontend development
     */
    @Profile("dev")
    @Bean("devCorsConfigurationSource")
    public CorsConfigurationSource devCorsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Enhanced origins for development - support multiple dev ports
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://localhost:*"
        ));
        
        // All HTTP methods for development flexibility
        configuration.setAllowedMethods(Arrays.asList("*"));
        
        // All headers for development flexibility
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Additional headers exposed for frontend debugging
        configuration.setExposedHeaders(Arrays.asList(
            "X-Created-ID",
            "X-Correlation-ID", 
            "X-Request-ID",
            "X-Debug-Info"
        ));
        
        // Allow credentials
        configuration.setAllowCredentials(true);
        
        // Longer cache for development (reduces preflight requests)
        configuration.setMaxAge(7200L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}