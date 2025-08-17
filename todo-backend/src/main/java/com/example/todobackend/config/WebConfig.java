package com.example.todobackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Web configuration for serving Angular SPA and static resources.
 * Feature 15: Production Configuration
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Configure resource handlers for static content and SPA routing support.
     * This ensures that Angular routes work correctly when deployed as a single JAR.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve static resources for Angular app
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(31556926) // 1 year cache for production
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        
                        // If the requested resource exists and is readable, serve it
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        
                        // For Angular routing: if resource doesn't exist, fallback to index.html
                        // This enables client-side routing to work properly
                        return location.createRelative("index.html");
                    }
                });
        
        // Explicitly handle common static file types with appropriate caching
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCachePeriod(31556926); // 1 year cache for assets
        
        registry.addResourceHandler("/*.js", "/*.css", "/*.ico", "/*.png", "/*.jpg", "/*.svg")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(31556926); // 1 year cache for build artifacts
    }

    /**
     * Add view controllers for SPA routing support.
     * Ensures that the root path serves the Angular application.
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward root requests to index.html
        registry.addViewController("/")
                .setViewName("forward:/index.html");
        
        // Forward common Angular routes to index.html
        registry.addViewController("/active")
                .setViewName("forward:/index.html");
        
        registry.addViewController("/completed")
                .setViewName("forward:/index.html");
    }
}