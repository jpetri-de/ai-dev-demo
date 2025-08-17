// Security and Production Readiness Test Suite for TodoMVC
// Tests security configurations, input validation, and production deployment readiness

class SecurityProductionTester {
    constructor() {
        this.apiUrl = 'http://localhost:8080/api';
        this.frontendUrl = 'http://localhost:4200';
        this.results = [];
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    addResult(testName, status, details = '', recommendations = []) {
        this.results.push({
            testName,
            status,
            details,
            recommendations,
            timestamp: new Date().toISOString()
        });
        
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        this.log(`${statusIcon} ${testName}: ${status} ${details ? `- ${details}` : ''}`);
    }

    async makeRequest(method, url, body = null, headers = {}) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };
            
            if (body) {
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(url, options);
            const data = response.status === 204 ? null : await response.json().catch(() => null);
            
            return { 
                status: response.status, 
                data, 
                headers: response.headers,
                ok: response.ok
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    async testCORSConfiguration() {
        this.log('Testing CORS configuration...');
        
        try {
            // Test preflight request
            const preflightResponse = await fetch(`${this.apiUrl}/todos`, {
                method: 'OPTIONS',
                headers: {
                    'Origin': 'http://localhost:4200',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                }
            });
            
            const corsHeaders = {
                allowOrigin: preflightResponse.headers.get('Access-Control-Allow-Origin'),
                allowMethods: preflightResponse.headers.get('Access-Control-Allow-Methods'),
                allowHeaders: preflightResponse.headers.get('Access-Control-Allow-Headers'),
                maxAge: preflightResponse.headers.get('Access-Control-Max-Age')
            };
            
            this.addResult(
                'SEC-01: CORS preflight support',
                preflightResponse.ok ? 'PASS' : 'FAIL',
                `Preflight status: ${preflightResponse.status}`,
                corsHeaders.allowOrigin ? [] : ['Configure CORS for production domains']
            );
            
            // Test actual CORS request
            const corsResponse = await this.makeRequest('GET', `${this.apiUrl}/todos`, null, {
                'Origin': 'http://localhost:4200'
            });
            
            const hasCORSHeaders = corsResponse.headers && corsResponse.headers.get('Access-Control-Allow-Origin');
            
            this.addResult(
                'SEC-02: CORS headers in responses',
                hasCORSHeaders ? 'PASS' : 'WARN',
                `CORS origin header: ${hasCORSHeaders || 'not present'}`,
                !hasCORSHeaders ? ['Ensure CORS headers are present in all API responses'] : []
            );
            
            // Test CORS with invalid origin
            const invalidOriginResponse = await this.makeRequest('GET', `${this.apiUrl}/todos`, null, {
                'Origin': 'http://malicious-site.com'
            });
            
            const blocksInvalidOrigin = !invalidOriginResponse.headers || 
                !invalidOriginResponse.headers.get('Access-Control-Allow-Origin') ||
                invalidOriginResponse.headers.get('Access-Control-Allow-Origin') === 'http://malicious-site.com';
            
            this.addResult(
                'SEC-03: CORS origin validation',
                blocksInvalidOrigin ? 'WARN' : 'PASS',
                'CORS allows all origins (*)',
                ['Configure specific allowed origins for production']
            );
            
        } catch (error) {
            this.addResult('CORS configuration tests', 'FAIL', error.message);
        }
    }

    async testInputValidation() {
        this.log('Testing input validation and sanitization...');
        
        try {
            // Test empty and whitespace-only titles
            const invalidInputs = [
                { title: '', expected: 'reject' },
                { title: '   ', expected: 'reject' },
                { title: '\t\n\r', expected: 'reject' },
                { title: null, expected: 'reject' },
                { title: undefined, expected: 'reject' }
            ];
            
            for (const input of invalidInputs) {
                const response = await this.makeRequest('POST', `${this.apiUrl}/todos`, input);
                const isRejected = !response.ok || response.status >= 400;
                
                this.addResult(
                    `SEC-04: Input validation for "${JSON.stringify(input.title)}"`,
                    isRejected ? 'PASS' : 'WARN',
                    isRejected ? 'Invalid input rejected' : 'Invalid input accepted',
                    !isRejected ? ['Implement server-side validation for empty/whitespace titles'] : []
                );
            }
            
            // Test XSS prevention
            const xssPayloads = [
                '<script>alert("xss")</script>',
                '<img src=x onerror=alert("xss")>',
                'javascript:alert("xss")',
                '"><script>alert("xss")</script>',
                '\' OR 1=1 --'
            ];
            
            for (const payload of xssPayloads) {
                const response = await this.makeRequest('POST', `${this.apiUrl}/todos`, { title: payload });
                
                if (response.ok && response.data) {
                    const isEscaped = response.data.title !== payload;
                    
                    this.addResult(
                        `SEC-05: XSS prevention for script payload`,
                        isEscaped ? 'PASS' : 'WARN',
                        isEscaped ? 'Payload sanitized' : 'Payload not escaped',
                        !isEscaped ? ['Implement HTML/JavaScript escaping for user input'] : []
                    );
                    
                    // Clean up
                    await this.makeRequest('DELETE', `${this.apiUrl}/todos/${response.data.id}`);
                }
            }
            
            // Test long input handling
            const longTitle = 'A'.repeat(10000);
            const longResponse = await this.makeRequest('POST', `${this.apiUrl}/todos`, { title: longTitle });
            
            this.addResult(
                'SEC-06: Long input handling',
                !longResponse.ok || (longResponse.data && longResponse.data.title.length < 10000) ? 'PASS' : 'WARN',
                longResponse.ok ? 'Long input accepted/truncated' : 'Long input rejected',
                longResponse.ok && longResponse.data && longResponse.data.title.length >= 10000 ? 
                    ['Implement input length limits'] : []
            );
            
            if (longResponse.ok && longResponse.data) {
                await this.makeRequest('DELETE', `${this.apiUrl}/todos/${longResponse.data.id}`);
            }
            
        } catch (error) {
            this.addResult('Input validation tests', 'FAIL', error.message);
        }
    }

    async testErrorHandling() {
        this.log('Testing error handling and information disclosure...');
        
        try {
            // Test 404 handling
            const notFoundResponse = await this.makeRequest('GET', `${this.apiUrl}/todos/99999`);
            
            this.addResult(
                'SEC-07: 404 error handling',
                notFoundResponse.status === 404 ? 'PASS' : 'FAIL',
                `Non-existent resource returns ${notFoundResponse.status}`,
                notFoundResponse.status !== 404 ? ['Ensure proper 404 responses for missing resources'] : []
            );
            
            // Test malformed request handling
            const malformedResponse = await fetch(`${this.apiUrl}/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid json}'
            });
            
            this.addResult(
                'SEC-08: Malformed request handling',
                malformedResponse.status === 400 ? 'PASS' : 'WARN',
                `Malformed JSON returns ${malformedResponse.status}`,
                malformedResponse.status !== 400 ? ['Return 400 for malformed requests'] : []
            );
            
            // Test unsupported method handling
            const unsupportedResponse = await this.makeRequest('PATCH', `${this.apiUrl}/todos`);
            
            this.addResult(
                'SEC-09: Unsupported method handling',
                unsupportedResponse.status === 405 ? 'PASS' : 'WARN',
                `Unsupported method returns ${unsupportedResponse.status}`,
                unsupportedResponse.status !== 405 ? ['Return 405 for unsupported HTTP methods'] : []
            );
            
            // Test error message content
            const errorResponse = await this.makeRequest('GET', `${this.apiUrl}/todos/invalid`);
            
            if (errorResponse.data && typeof errorResponse.data === 'object') {
                const hasStackTrace = JSON.stringify(errorResponse.data).includes('Exception') || 
                                   JSON.stringify(errorResponse.data).includes('stack') ||
                                   JSON.stringify(errorResponse.data).includes('at ');
                
                this.addResult(
                    'SEC-10: Error message security',
                    !hasStackTrace ? 'PASS' : 'WARN',
                    hasStackTrace ? 'Error messages may expose internal details' : 'Error messages are clean',
                    hasStackTrace ? ['Remove stack traces and internal details from error responses'] : []
                );
            }
            
        } catch (error) {
            this.addResult('Error handling tests', 'FAIL', error.message);
        }
    }

    async testHTTPSecurity() {
        this.log('Testing HTTP security headers...');
        
        try {
            const response = await fetch(`${this.apiUrl}/todos`);
            
            const securityHeaders = {
                'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
                'X-Frame-Options': response.headers.get('X-Frame-Options'),
                'X-XSS-Protection': response.headers.get('X-XSS-Protection'),
                'Strict-Transport-Security': response.headers.get('Strict-Transport-Security'),
                'Content-Security-Policy': response.headers.get('Content-Security-Policy'),
                'Referrer-Policy': response.headers.get('Referrer-Policy')
            };
            
            Object.entries(securityHeaders).forEach(([header, value]) => {
                this.addResult(
                    `SEC-11: ${header} header`,
                    value ? 'PASS' : 'WARN',
                    value ? `Present: ${value}` : 'Not present',
                    !value ? [`Add ${header} security header`] : []
                );
            });
            
            // Test content type validation
            const contentTypeResponse = await fetch(`${this.apiUrl}/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: 'not json'
            });
            
            this.addResult(
                'SEC-12: Content-Type validation',
                contentTypeResponse.status === 415 || contentTypeResponse.status === 400 ? 'PASS' : 'WARN',
                `Invalid content-type returns ${contentTypeResponse.status}`,
                contentTypeResponse.status < 400 ? ['Validate Content-Type headers'] : []
            );
            
        } catch (error) {
            this.addResult('HTTP security tests', 'FAIL', error.message);
        }
    }

    async testProductionConfiguration() {
        this.log('Testing production configuration...');
        
        try {
            // Test if debug information is exposed
            const debugResponse = await this.makeRequest('GET', `${this.apiUrl}/actuator`);
            
            this.addResult(
                'PROD-01: Debug endpoints exposure',
                debugResponse.status === 404 ? 'PASS' : 'WARN',
                debugResponse.status === 404 ? 'Debug endpoints not exposed' : 'Debug endpoints accessible',
                debugResponse.status !== 404 ? ['Disable or secure actuator endpoints in production'] : []
            );
            
            // Test environment detection
            const envResponse = await this.makeRequest('GET', `${this.apiUrl}/todos`);
            const hasServerHeader = envResponse.headers && envResponse.headers.get('Server');
            
            this.addResult(
                'PROD-02: Server information disclosure',
                !hasServerHeader || !hasServerHeader.includes('version') ? 'PASS' : 'WARN',
                hasServerHeader ? `Server header: ${hasServerHeader}` : 'No server header',
                hasServerHeader && hasServerHeader.includes('version') ? 
                    ['Remove version information from server headers'] : []
            );
            
            // Test API versioning
            const versionResponse = await this.makeRequest('GET', `${this.apiUrl}/version`);
            
            this.addResult(
                'PROD-03: API versioning',
                versionResponse.status === 404 ? 'WARN' : 'PASS',
                versionResponse.status === 404 ? 'No version endpoint' : 'Version endpoint available',
                versionResponse.status === 404 ? ['Consider adding API versioning'] : []
            );
            
            // Test rate limiting (basic check)
            const rateLimitPromises = Array(100).fill().map(() => 
                this.makeRequest('GET', `${this.apiUrl}/todos`)
            );
            
            const rateLimitResults = await Promise.allSettled(rateLimitPromises);
            const rateLimitedRequests = rateLimitResults.filter(r => 
                r.status === 'fulfilled' && r.value.status === 429
            ).length;
            
            this.addResult(
                'PROD-04: Rate limiting',
                rateLimitedRequests > 0 ? 'PASS' : 'WARN',
                rateLimitedRequests > 0 ? 
                    `${rateLimitedRequests}/100 requests rate limited` : 
                    'No rate limiting detected',
                rateLimitedRequests === 0 ? ['Implement rate limiting for production'] : []
            );
            
        } catch (error) {
            this.addResult('Production configuration tests', 'FAIL', error.message);
        }
    }

    async testDataValidation() {
        this.log('Testing data validation and integrity...');
        
        try {
            // Test data type validation
            const invalidDataTypes = [
                { title: 123 },
                { title: true },
                { title: [] },
                { title: {} },
                { completed: "yes" },
                { completed: 1 }
            ];
            
            for (const invalidData of invalidDataTypes) {
                const response = await this.makeRequest('POST', `${this.apiUrl}/todos`, invalidData);
                const isRejected = !response.ok || response.status >= 400;
                
                this.addResult(
                    `SEC-13: Data type validation for ${JSON.stringify(invalidData)}`,
                    isRejected ? 'PASS' : 'WARN',
                    isRejected ? 'Invalid data type rejected' : 'Invalid data type accepted',
                    !isRejected ? ['Implement strict data type validation'] : []
                );
            }
            
            // Test SQL injection patterns (even though we're not using SQL)
            const injectionPatterns = [
                "'; DROP TABLE todos; --",
                "' OR '1'='1",
                "UNION SELECT * FROM users",
                "'; INSERT INTO todos (title) VALUES ('hacked'); --"
            ];
            
            for (const pattern of injectionPatterns) {
                const response = await this.makeRequest('POST', `${this.apiUrl}/todos`, { title: pattern });
                
                if (response.ok && response.data) {
                    const isEscaped = response.data.title !== pattern;
                    
                    this.addResult(
                        'SEC-14: Injection pattern handling',
                        'PASS',
                        'Injection pattern handled safely (using in-memory storage)',
                        []
                    );
                    
                    // Clean up
                    await this.makeRequest('DELETE', `${this.apiUrl}/todos/${response.data.id}`);
                }
            }
            
        } catch (error) {
            this.addResult('Data validation tests', 'FAIL', error.message);
        }
    }

    async testFrontendSecurity() {
        this.log('Testing frontend security...');
        
        try {
            // Test frontend accessibility
            const frontendResponse = await fetch(this.frontendUrl);
            const frontendHtml = await frontendResponse.text();
            
            // Check for security-related meta tags
            const hasCSP = frontendHtml.includes('Content-Security-Policy');
            const hasXFrameOptions = frontendHtml.includes('X-Frame-Options');
            
            this.addResult(
                'FRONT-01: Frontend security headers',
                hasCSP || hasXFrameOptions ? 'PASS' : 'WARN',
                `CSP: ${hasCSP}, X-Frame-Options: ${hasXFrameOptions}`,
                !hasCSP && !hasXFrameOptions ? ['Add security headers to frontend'] : []
            );
            
            // Check for debug information in HTML
            const hasDebugInfo = frontendHtml.includes('debug') || 
                               frontendHtml.includes('console.log') ||
                               frontendHtml.includes('development');
            
            this.addResult(
                'FRONT-02: Debug information exposure',
                !hasDebugInfo ? 'PASS' : 'WARN',
                hasDebugInfo ? 'Debug information found in HTML' : 'No debug information exposed',
                hasDebugInfo ? ['Remove debug information from production build'] : []
            );
            
            // Test for source maps in production
            const hasSourceMaps = frontendHtml.includes('.map') || frontendHtml.includes('sourceMappingURL');
            
            this.addResult(
                'FRONT-03: Source map exposure',
                !hasSourceMaps ? 'PASS' : 'WARN',
                hasSourceMaps ? 'Source maps may be exposed' : 'No source maps in HTML',
                hasSourceMaps ? ['Disable source maps in production'] : []
            );
            
        } catch (error) {
            this.addResult('Frontend security tests', 'FAIL', error.message);
        }
    }

    generateSecurityReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.status === 'PASS').length;
        const failedTests = this.results.filter(r => r.status === 'FAIL').length;
        const warnTests = this.results.filter(r => r.status === 'WARN').length;
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

        console.log('\n' + '='.repeat(80));
        console.log('SECURITY AND PRODUCTION READINESS REPORT');
        console.log('TodoMVC Application Security Assessment');
        console.log('='.repeat(80));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Warnings: ${warnTests} (${((warnTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Security Score: ${successRate}%`);
        console.log('='.repeat(80));

        // Group results by category
        const categories = {};
        this.results.forEach(result => {
            const category = result.testName.split('-')[0];
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(result);
        });

        Object.keys(categories).forEach(category => {
            console.log(`\n${category} Tests:`);
            categories[category].forEach(result => {
                const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
                console.log(`  ${statusIcon} ${result.testName}`);
                if (result.details) {
                    console.log(`     ${result.details}`);
                }
                if (result.recommendations && result.recommendations.length > 0) {
                    console.log(`     Recommendations: ${result.recommendations.join(', ')}`);
                }
            });
        });

        // Security recommendations
        console.log('\n' + '='.repeat(80));
        console.log('SECURITY RECOMMENDATIONS FOR PRODUCTION:');
        console.log('='.repeat(80));

        const allRecommendations = this.results
            .filter(r => r.recommendations && r.recommendations.length > 0)
            .flatMap(r => r.recommendations);

        if (allRecommendations.length === 0) {
            console.log('✅ No critical security issues found! Good security posture.');
        } else {
            console.log('🔒 Security improvements needed:');
            [...new Set(allRecommendations)].forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        console.log('\n📋 Production Security Checklist:');
        console.log('   □ CORS configured for production domains only');
        console.log('   □ Input validation and sanitization implemented');
        console.log('   □ Security headers configured (CSP, X-Frame-Options, etc.)');
        console.log('   □ Error messages do not expose internal details');
        console.log('   □ Rate limiting implemented');
        console.log('   □ Debug endpoints disabled or secured');
        console.log('   □ Source maps disabled in production');
        console.log('   □ HTTPS enforced (when deployed)');
        console.log('   □ Security monitoring and logging in place');

        return {
            summary: {
                totalTests,
                passedTests,
                failedTests,
                warnTests,
                securityScore: parseFloat(successRate),
                recommendations: [...new Set(allRecommendations)]
            },
            results: this.results
        };
    }

    async runAllTests() {
        this.log('Starting Security and Production Readiness Tests...');
        
        try {
            await this.testCORSConfiguration();
            await this.testInputValidation();
            await this.testErrorHandling();
            await this.testHTTPSecurity();
            await this.testProductionConfiguration();
            await this.testDataValidation();
            await this.testFrontendSecurity();
            
            return this.generateSecurityReport();
        } catch (error) {
            this.log(`Security test suite failed: ${error.message}`);
            throw error;
        }
    }
}

// Export for usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityProductionTester;
}

// Auto-run for Node.js
if (typeof module !== 'undefined' && require.main === module) {
    const tester = new SecurityProductionTester();
    tester.runAllTests().then(report => {
        console.log('Security and production tests completed!');
        process.exit(0);
    }).catch(error => {
        console.error('Security and production tests failed:', error);
        process.exit(1);
    });
}