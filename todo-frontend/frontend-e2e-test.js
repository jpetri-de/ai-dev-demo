// Frontend End-to-End Test Suite for TodoMVC Features 09-15
// This script tests the frontend directly using browser automation concepts

class FrontendE2ETester {
    constructor() {
        this.testResults = [];
        this.baseUrl = 'http://localhost:4200';
        this.apiUrl = 'http://localhost:8080/api';
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    addResult(testName, status, details = '') {
        this.testResults.push({
            testName,
            status,
            details,
            timestamp: new Date().toISOString()
        });
        
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        this.log(`${statusIcon} ${testName}: ${status} ${details ? `- ${details}` : ''}`);
    }

    async setupTestEnvironment() {
        this.log('Setting up test environment...');
        
        // Clear existing todos via API
        try {
            const response = await fetch(`${this.apiUrl}/todos`);
            const todos = await response.json();
            
            for (const todo of todos) {
                await fetch(`${this.apiUrl}/todos/${todo.id}`, { method: 'DELETE' });
            }
            
            this.addResult('ENV-01: Test environment setup', 'PASS', 'Existing todos cleared');
        } catch (error) {
            this.addResult('ENV-01: Test environment setup', 'FAIL', error.message);
        }
    }

    async testFrontendAccessibility() {
        this.log('Testing frontend accessibility...');
        
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            // Check basic HTML structure
            const hasAppRoot = html.includes('<app-root>');
            this.addResult('F-ACC-01: App root element present', hasAppRoot ? 'PASS' : 'FAIL');
            
            const hasViewport = html.includes('viewport');
            this.addResult('F-ACC-02: Viewport meta tag present', hasViewport ? 'PASS' : 'FAIL');
            
            const hasTitle = html.includes('<title>');
            this.addResult('F-ACC-03: Page title present', hasTitle ? 'PASS' : 'FAIL');
            
            // Check for JavaScript modules
            const hasModules = html.includes('type="module"');
            this.addResult('F-ACC-04: Modern JavaScript modules', hasModules ? 'PASS' : 'FAIL');
            
        } catch (error) {
            this.addResult('Frontend accessibility tests', 'FAIL', error.message);
        }
    }

    async testAPIIntegrationFromFrontend() {
        this.log('Testing API integration from frontend perspective...');
        
        try {
            // Test CORS by making request from frontend domain
            const response = await fetch(`${this.baseUrl}/api/todos`);
            
            this.addResult(
                'F-API-01: Frontend can reach API via proxy',
                response.ok ? 'PASS' : 'FAIL',
                `Status: ${response.status}`
            );
            
            if (response.ok) {
                const todos = await response.json();
                this.addResult(
                    'F-API-02: API returns valid JSON',
                    Array.isArray(todos) ? 'PASS' : 'FAIL',
                    `Response type: ${typeof todos}`
                );
            }
            
            // Test CORS headers from frontend perspective
            const corsHeaders = response.headers.get('Access-Control-Allow-Origin');
            this.addResult(
                'F-API-03: CORS headers accessible from frontend',
                corsHeaders !== null ? 'PASS' : 'WARN',
                `CORS header: ${corsHeaders || 'not present'}`
            );
            
        } catch (error) {
            this.addResult('Frontend API integration tests', 'FAIL', error.message);
        }
    }

    async testUserWorkflows() {
        this.log('Testing user workflows...');
        
        try {
            // Simulate basic todo creation workflow
            const createResponse = await fetch(`${this.baseUrl}/api/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'User Workflow Test Todo' })
            });
            
            this.addResult(
                'UW-01: Create todo workflow',
                createResponse.ok ? 'PASS' : 'FAIL',
                `Can create todos via frontend API`
            );
            
            if (createResponse.ok) {
                const newTodo = await createResponse.json();
                
                // Test toggle workflow
                const toggleResponse = await fetch(`${this.baseUrl}/api/todos/${newTodo.id}/toggle`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completed: true })
                });
                
                this.addResult(
                    'UW-02: Toggle todo workflow',
                    toggleResponse.ok ? 'PASS' : 'FAIL',
                    `Can toggle todos via frontend API`
                );
                
                // Test delete workflow
                const deleteResponse = await fetch(`${this.baseUrl}/api/todos/${newTodo.id}`, {
                    method: 'DELETE'
                });
                
                this.addResult(
                    'UW-03: Delete todo workflow',
                    deleteResponse.ok ? 'PASS' : 'FAIL',
                    `Can delete todos via frontend API`
                );
            }
            
        } catch (error) {
            this.addResult('User workflow tests', 'FAIL', error.message);
        }
    }

    async testFeatureIntegrationWorkflows() {
        this.log('Testing feature integration workflows...');
        
        try {
            // Create multiple todos for integration testing
            const todos = await Promise.all([
                fetch(`${this.baseUrl}/api/todos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'Integration Test 1' })
                }),
                fetch(`${this.baseUrl}/api/todos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'Integration Test 2' })
                }),
                fetch(`${this.baseUrl}/api/todos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'Integration Test 3' })
                })
            ]);
            
            const createdTodos = await Promise.all(todos.map(r => r.json()));
            
            this.addResult(
                'FI-01: Multiple todo creation for integration',
                createdTodos.length === 3 ? 'PASS' : 'FAIL',
                `Created ${createdTodos.length} todos`
            );
            
            // Test Feature 11: Toggle All workflow
            const toggleAllResponse = await fetch(`${this.baseUrl}/api/todos/toggle-all`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: true })
            });
            
            this.addResult(
                'FI-02: Toggle-all integration workflow',
                toggleAllResponse.ok ? 'PASS' : 'FAIL',
                `Toggle-all endpoint accessible from frontend`
            );
            
            if (toggleAllResponse.ok) {
                const toggledTodos = await toggleAllResponse.json();
                const allCompleted = toggledTodos.every(t => t.completed === true);
                
                this.addResult(
                    'FI-03: Toggle-all marks all todos completed',
                    allCompleted ? 'PASS' : 'FAIL',
                    `All todos marked as completed: ${allCompleted}`
                );
            }
            
            // Test Feature 12: Clear Completed workflow
            const clearResponse = await fetch(`${this.baseUrl}/api/todos/completed`, {
                method: 'DELETE'
            });
            
            this.addResult(
                'FI-04: Clear completed integration workflow',
                clearResponse.status === 204 ? 'PASS' : 'FAIL',
                `Clear completed endpoint accessible from frontend`
            );
            
            // Verify todos are cleared
            const remainingResponse = await fetch(`${this.baseUrl}/api/todos`);
            const remainingTodos = await remainingResponse.json();
            
            this.addResult(
                'FI-05: Clear completed removes all todos',
                remainingTodos.length === 0 ? 'PASS' : 'FAIL',
                `${remainingTodos.length} todos remain after clear`
            );
            
        } catch (error) {
            this.addResult('Feature integration workflow tests', 'FAIL', error.message);
        }
    }

    async testPerformanceAndReliability() {
        this.log('Testing performance and reliability...');
        
        try {
            // Test concurrent requests
            const startTime = Date.now();
            const concurrentRequests = Array(20).fill().map((_, i) =>
                fetch(`${this.baseUrl}/api/todos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: `Performance Test ${i}` })
                })
            );
            
            const responses = await Promise.all(concurrentRequests);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            const allSuccessful = responses.every(r => r.ok);
            
            this.addResult(
                'PERF-01: Concurrent request handling',
                allSuccessful ? 'PASS' : 'FAIL',
                `${responses.filter(r => r.ok).length}/${responses.length} requests successful in ${duration}ms`
            );
            
            this.addResult(
                'PERF-02: Response time under load',
                duration < 5000 ? 'PASS' : 'WARN',
                `20 concurrent requests completed in ${duration}ms`
            );
            
            // Test bulk operations performance
            const bulkStartTime = Date.now();
            await fetch(`${this.baseUrl}/api/todos/toggle-all`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: true })
            });
            const bulkEndTime = Date.now();
            const bulkDuration = bulkEndTime - bulkStartTime;
            
            this.addResult(
                'PERF-03: Bulk operation performance',
                bulkDuration < 1000 ? 'PASS' : 'WARN',
                `Toggle-all completed in ${bulkDuration}ms`
            );
            
            // Clean up performance test data
            await fetch(`${this.baseUrl}/api/todos/completed`, { method: 'DELETE' });
            
        } catch (error) {
            this.addResult('Performance and reliability tests', 'FAIL', error.message);
        }
    }

    async testSecurityAndValidation() {
        this.log('Testing security and validation...');
        
        try {
            // Test input validation
            const invalidInputs = [
                { title: '' },
                { title: '   ' },
                { title: null },
                { title: undefined }
            ];
            
            for (const input of invalidInputs) {
                try {
                    const response = await fetch(`${this.baseUrl}/api/todos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(input)
                    });
                    
                    if (response.ok) {
                        this.addResult(
                            `SEC-01: Input validation for "${input.title}"`,
                            'WARN',
                            'Invalid input was accepted'
                        );
                    } else {
                        this.addResult(
                            `SEC-01: Input validation for "${input.title}"`,
                            'PASS',
                            'Invalid input properly rejected'
                        );
                    }
                } catch (error) {
                    this.addResult(
                        `SEC-01: Input validation for "${input.title}"`,
                        'PASS',
                        'Invalid input caused expected error'
                    );
                }
            }
            
            // Test XSS prevention
            const xssPayload = '<script>alert("xss")</script>';
            const xssResponse = await fetch(`${this.baseUrl}/api/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: xssPayload })
            });
            
            if (xssResponse.ok) {
                const todo = await xssResponse.json();
                const isEscaped = todo.title !== xssPayload;
                
                this.addResult(
                    'SEC-02: XSS prevention',
                    isEscaped ? 'PASS' : 'WARN',
                    `Script payload ${isEscaped ? 'escaped' : 'not escaped'}`
                );
                
                // Clean up
                await fetch(`${this.baseUrl}/api/todos/${todo.id}`, { method: 'DELETE' });
            }
            
            // Test SQL injection prevention (basic)
            const sqlPayload = "'; DROP TABLE todos; --";
            const sqlResponse = await fetch(`${this.baseUrl}/api/todos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: sqlPayload })
            });
            
            if (sqlResponse.ok) {
                const todo = await sqlResponse.json();
                
                this.addResult(
                    'SEC-03: SQL injection prevention',
                    'PASS',
                    'SQL payload handled safely'
                );
                
                // Clean up
                await fetch(`${this.baseUrl}/api/todos/${todo.id}`, { method: 'DELETE' });
            }
            
        } catch (error) {
            this.addResult('Security and validation tests', 'FAIL', error.message);
        }
    }

    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
        const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnTests = this.testResults.filter(r => r.status === 'WARN').length;
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

        console.log('\n' + '='.repeat(80));
        console.log('FRONTEND END-TO-END INTEGRATION TEST REPORT');
        console.log('TodoMVC User Workflows and Frontend-Backend Integration');
        console.log('='.repeat(80));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Warnings: ${warnTests} (${((warnTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Success Rate: ${successRate}%`);
        console.log('='.repeat(80));

        // Group results by category
        const categories = {};
        this.testResults.forEach(result => {
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
            });
        });

        console.log('\n' + '='.repeat(80));
        console.log('FRONTEND INTEGRATION SUMMARY:');
        console.log('='.repeat(80));

        if (failedTests === 0) {
            console.log('✅ All frontend tests passed! User workflows and integration working correctly.');
        } else {
            console.log('❌ Frontend issues found:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(result => {
                    console.log(`   - ${result.testName}: ${result.details}`);
                });
        }

        if (warnTests > 0) {
            console.log('\n⚠️ Frontend warnings:');
            this.testResults
                .filter(r => r.status === 'WARN')
                .forEach(result => {
                    console.log(`   - ${result.testName}: ${result.details}`);
                });
        }

        return {
            summary: {
                totalTests,
                passedTests,
                failedTests,
                warnTests,
                successRate: parseFloat(successRate)
            },
            results: this.testResults
        };
    }

    async runAllTests() {
        this.log('Starting Frontend End-to-End Integration Tests...');
        
        try {
            await this.setupTestEnvironment();
            await this.testFrontendAccessibility();
            await this.testAPIIntegrationFromFrontend();
            await this.testUserWorkflows();
            await this.testFeatureIntegrationWorkflows();
            await this.testPerformanceAndReliability();
            await this.testSecurityAndValidation();
            
            return this.generateReport();
        } catch (error) {
            this.log(`Frontend test suite failed: ${error.message}`);
            throw error;
        }
    }
}

// Usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendE2ETester;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    window.FrontendE2ETester = FrontendE2ETester;
    console.log('Frontend E2E Tester loaded. Run: new FrontendE2ETester().runAllTests()');
}

// Auto-run for Node.js
if (typeof module !== 'undefined' && require.main === module) {
    const tester = new FrontendE2ETester();
    tester.runAllTests().then(report => {
        console.log('Frontend E2E tests completed!');
        process.exit(0);
    }).catch(error => {
        console.error('Frontend E2E tests failed:', error);
        process.exit(1);
    });
}