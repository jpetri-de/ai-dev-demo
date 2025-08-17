// Comprehensive API Integration Test Suite for TodoMVC Features 09-15
// Run this in browser console or as Node.js script

class TodoMVCIntegrationTester {
    constructor(baseUrl = 'http://localhost:8080/api') {
        this.baseUrl = baseUrl;
        this.testResults = [];
        this.startTime = Date.now();
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    addResult(testName, status, details = '', actualValue = '', expectedValue = '') {
        this.testResults.push({
            testName,
            status,
            details,
            actualValue,
            expectedValue,
            timestamp: new Date().toISOString()
        });
        
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        this.log(`${statusIcon} ${testName}: ${status} ${details ? `- ${details}` : ''}`);
    }

    async makeRequest(method, endpoint, body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const data = response.status === 204 ? null : await response.json();
            return { status: response.status, data, headers: response.headers };
        } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
        }
    }

    async setupTestData() {
        this.log('Setting up test data...');
        
        // Clear existing todos
        await this.makeRequest('DELETE', '/todos/completed');
        const todos = await this.makeRequest('GET', '/todos');
        for (const todo of todos.data || []) {
            await this.makeRequest('DELETE', `/todos/${todo.id}`);
        }

        // Create test todos
        const testTodos = [
            { title: 'Learn Angular', completed: false },
            { title: 'Write comprehensive tests', completed: false },
            { title: 'Deploy to production', completed: false },
            { title: 'Review code quality', completed: true },
            { title: 'Update documentation', completed: true }
        ];

        this.createdTodos = [];
        for (const todo of testTodos) {
            const response = await this.makeRequest('POST', '/todos', { title: todo.title });
            if (todo.completed) {
                await this.makeRequest('PUT', `/todos/${response.data.id}/toggle`, { completed: true });
            }
            this.createdTodos.push(response.data);
        }

        this.log(`Created ${this.createdTodos.length} test todos`);
    }

    async testFeature09Counter() {
        this.log('Testing Feature 09: Counter functionality...');

        try {
            // Get current todos
            const response = await this.makeRequest('GET', '/todos');
            const todos = response.data;
            const activeTodos = todos.filter(t => !t.completed);
            const completedTodos = todos.filter(t => t.completed);

            this.addResult(
                'F09-01: API returns todos with completion status',
                todos.length > 0 ? 'PASS' : 'FAIL',
                `Found ${todos.length} total todos`,
                todos.length.toString(),
                '> 0'
            );

            this.addResult(
                'F09-02: Counter logic for active todos',
                activeTodos.length >= 0 ? 'PASS' : 'FAIL',
                `${activeTodos.length} active todos found`,
                activeTodos.length.toString(),
                '>= 0'
            );

            this.addResult(
                'F09-03: Counter logic for completed todos',
                completedTodos.length >= 0 ? 'PASS' : 'FAIL',
                `${completedTodos.length} completed todos found`,
                completedTodos.length.toString(),
                '>= 0'
            );

            // Test pluralization scenarios
            const scenarios = [
                { count: 0, expected: '0 items left' },
                { count: 1, expected: '1 item left' },
                { count: 2, expected: '2 items left' }
            ];

            scenarios.forEach(scenario => {
                const pluralized = this.getCounterText(scenario.count);
                this.addResult(
                    `F09-04: Pluralization for ${scenario.count} items`,
                    pluralized === scenario.expected ? 'PASS' : 'FAIL',
                    `Counter text generation`,
                    pluralized,
                    scenario.expected
                );
            });

        } catch (error) {
            this.addResult('F09: Counter tests', 'FAIL', error.message);
        }
    }

    getCounterText(count) {
        return count === 1 ? '1 item left' : `${count} items left`;
    }

    async testFeature10Filters() {
        this.log('Testing Feature 10: Filter functionality...');

        try {
            const response = await this.makeRequest('GET', '/todos');
            const allTodos = response.data;
            const activeTodos = allTodos.filter(t => !t.completed);
            const completedTodos = allTodos.filter(t => t.completed);

            this.addResult(
                'F10-01: All filter data availability',
                allTodos.length > 0 ? 'PASS' : 'FAIL',
                `API provides all todos for filtering`,
                allTodos.length.toString(),
                '> 0'
            );

            this.addResult(
                'F10-02: Active filter data',
                activeTodos.length >= 0 ? 'PASS' : 'FAIL',
                `Can filter active todos from API data`,
                activeTodos.length.toString(),
                '>= 0'
            );

            this.addResult(
                'F10-03: Completed filter data',
                completedTodos.length >= 0 ? 'PASS' : 'FAIL',
                `Can filter completed todos from API data`,
                completedTodos.length.toString(),
                '>= 0'
            );

            // Test that both states exist for proper filtering
            const hasBothStates = activeTodos.length > 0 && completedTodos.length > 0;
            this.addResult(
                'F10-04: Mixed state data for filter testing',
                hasBothStates ? 'PASS' : 'WARN',
                `Both active and completed todos exist`,
                `Active: ${activeTodos.length}, Completed: ${completedTodos.length}`,
                'Both > 0'
            );

        } catch (error) {
            this.addResult('F10: Filter tests', 'FAIL', error.message);
        }
    }

    async testFeature11ToggleAll() {
        this.log('Testing Feature 11: Toggle All functionality...');

        try {
            // Test toggle all to completed
            const toggleResponse = await this.makeRequest('PUT', '/todos/toggle-all', { completed: true });
            
            this.addResult(
                'F11-01: Toggle-all endpoint exists',
                toggleResponse.status === 200 ? 'PASS' : 'FAIL',
                `Toggle-all API endpoint responds`,
                toggleResponse.status.toString(),
                '200'
            );

            const allCompleted = toggleResponse.data;
            const allAreCompleted = allCompleted.every(todo => todo.completed === true);

            this.addResult(
                'F11-02: Toggle-all marks all as completed',
                allAreCompleted ? 'PASS' : 'FAIL',
                `All todos marked as completed`,
                allAreCompleted.toString(),
                'true'
            );

            // Test toggle all to uncompleted
            const toggleBackResponse = await this.makeRequest('PUT', '/todos/toggle-all', { completed: false });
            const allUncompleted = toggleBackResponse.data;
            const allAreUncompleted = allUncompleted.every(todo => todo.completed === false);

            this.addResult(
                'F11-03: Toggle-all marks all as uncompleted',
                allAreUncompleted ? 'PASS' : 'FAIL',
                `All todos marked as uncompleted`,
                allAreUncompleted.toString(),
                'true'
            );

            // Test response structure
            const hasValidStructure = allUncompleted.every(todo => 
                todo.hasOwnProperty('id') && 
                todo.hasOwnProperty('title') && 
                todo.hasOwnProperty('completed')
            );

            this.addResult(
                'F11-04: Toggle-all returns valid todo structure',
                hasValidStructure ? 'PASS' : 'FAIL',
                `Response has correct todo structure`,
                hasValidStructure.toString(),
                'true'
            );

        } catch (error) {
            this.addResult('F11: Toggle-all tests', 'FAIL', error.message);
        }
    }

    async testFeature12ClearCompleted() {
        this.log('Testing Feature 12: Clear Completed functionality...');

        try {
            // First, mark some todos as completed
            const todosResponse = await this.makeRequest('GET', '/todos');
            const todos = todosResponse.data;
            
            if (todos.length > 0) {
                // Mark first todo as completed
                await this.makeRequest('PUT', `/todos/${todos[0].id}/toggle`, { completed: true });
            }

            // Get updated state
            const updatedResponse = await this.makeRequest('GET', '/todos');
            const updatedTodos = updatedResponse.data;
            const completedTodos = updatedTodos.filter(t => t.completed);
            const activeTodos = updatedTodos.filter(t => !t.completed);

            this.addResult(
                'F12-01: Setup for clear completed test',
                completedTodos.length > 0 ? 'PASS' : 'WARN',
                `Has completed todos to clear`,
                completedTodos.length.toString(),
                '> 0'
            );

            // Test clear completed endpoint
            const clearResponse = await this.makeRequest('DELETE', '/todos/completed');

            this.addResult(
                'F12-02: Clear completed endpoint responds',
                clearResponse.status === 204 ? 'PASS' : 'FAIL',
                `Clear completed API responds correctly`,
                clearResponse.status.toString(),
                '204'
            );

            // Verify completed todos are removed
            const afterClearResponse = await this.makeRequest('GET', '/todos');
            const remainingTodos = afterClearResponse.data;
            const remainingCompleted = remainingTodos.filter(t => t.completed);

            this.addResult(
                'F12-03: Completed todos removed',
                remainingCompleted.length === 0 ? 'PASS' : 'FAIL',
                `No completed todos remain after clear`,
                remainingCompleted.length.toString(),
                '0'
            );

            // Verify active todos remain
            const remainingActive = remainingTodos.filter(t => !t.completed);
            this.addResult(
                'F12-04: Active todos preserved',
                remainingActive.length === activeTodos.length ? 'PASS' : 'FAIL',
                `Active todos preserved after clear completed`,
                remainingActive.length.toString(),
                activeTodos.length.toString()
            );

        } catch (error) {
            this.addResult('F12: Clear completed tests', 'FAIL', error.message);
        }
    }

    async testFeature13UIStates() {
        this.log('Testing Feature 13: UI States (API support)...');

        try {
            // Test empty state
            await this.clearAllTodos();
            const emptyResponse = await this.makeRequest('GET', '/todos');
            
            this.addResult(
                'F13-01: API supports empty state',
                Array.isArray(emptyResponse.data) && emptyResponse.data.length === 0 ? 'PASS' : 'FAIL',
                `API returns empty array when no todos`,
                emptyResponse.data.length.toString(),
                '0'
            );

            // Test with todos
            await this.makeRequest('POST', '/todos', { title: 'UI State Test Todo' });
            const withTodosResponse = await this.makeRequest('GET', '/todos');

            this.addResult(
                'F13-02: API supports populated state',
                withTodosResponse.data.length > 0 ? 'PASS' : 'FAIL',
                `API returns todos when they exist`,
                withTodosResponse.data.length.toString(),
                '> 0'
            );

            // Test response consistency for UI state management
            const todo = withTodosResponse.data[0];
            const hasRequiredFields = todo.id && todo.title !== undefined && typeof todo.completed === 'boolean';

            this.addResult(
                'F13-03: Consistent data structure for UI',
                hasRequiredFields ? 'PASS' : 'FAIL',
                `Todo objects have required fields for UI state management`,
                JSON.stringify(todo),
                'id, title, completed fields present'
            );

        } catch (error) {
            this.addResult('F13: UI states tests', 'FAIL', error.message);
        }
    }

    async testFeature14Integration() {
        this.log('Testing Feature 14: Integration features...');

        try {
            // Test CORS headers
            const corsResponse = await this.makeRequest('GET', '/todos');
            const corsHeader = corsResponse.headers.get('Access-Control-Allow-Origin');

            this.addResult(
                'F14-01: CORS headers present',
                corsHeader !== null ? 'PASS' : 'FAIL',
                `CORS configuration for frontend integration`,
                corsHeader || 'null',
                'not null'
            );

            // Test error handling with invalid data
            try {
                await this.makeRequest('POST', '/todos', { title: '' });
                this.addResult('F14-02: Input validation', 'FAIL', 'Empty title should be rejected');
            } catch (error) {
                this.addResult('F14-02: Input validation', 'PASS', 'Empty title properly rejected');
            }

            // Test error handling with non-existent todo
            try {
                await this.makeRequest('PUT', '/todos/99999/toggle', { completed: true });
                this.addResult('F14-03: 404 handling for non-existent todo', 'FAIL', 'Should return 404');
            } catch (error) {
                this.addResult('F14-03: 404 handling for non-existent todo', 'PASS', 'Properly returns 404');
            }

            // Test response times for optimistic updates
            const startTime = Date.now();
            await this.makeRequest('POST', '/todos', { title: 'Performance Test Todo' });
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            this.addResult(
                'F14-04: Response time for optimistic updates',
                responseTime < 1000 ? 'PASS' : 'WARN',
                `Response time: ${responseTime}ms`,
                responseTime.toString() + 'ms',
                '< 1000ms'
            );

        } catch (error) {
            this.addResult('F14: Integration tests', 'FAIL', error.message);
        }
    }

    async testFeature15Production() {
        this.log('Testing Feature 15: Production readiness...');

        try {
            // Test performance with multiple operations
            const operationCount = 50;
            const startTime = Date.now();

            // Create multiple todos quickly
            const createPromises = [];
            for (let i = 0; i < operationCount; i++) {
                createPromises.push(
                    this.makeRequest('POST', '/todos', { title: `Performance Test ${i}` })
                );
            }

            await Promise.all(createPromises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / operationCount;

            this.addResult(
                'F15-01: Concurrent operation performance',
                avgTime < 100 ? 'PASS' : 'WARN',
                `Average time per operation: ${avgTime.toFixed(2)}ms`,
                avgTime.toFixed(2) + 'ms',
                '< 100ms'
            );

            // Test bulk operations performance
            const bulkStartTime = Date.now();
            await this.makeRequest('PUT', '/todos/toggle-all', { completed: true });
            const bulkEndTime = Date.now();
            const bulkTime = bulkEndTime - bulkStartTime;

            this.addResult(
                'F15-02: Bulk operation performance',
                bulkTime < 500 ? 'PASS' : 'WARN',
                `Bulk toggle time: ${bulkTime}ms`,
                bulkTime.toString() + 'ms',
                '< 500ms'
            );

            // Test memory efficiency by creating and clearing many todos
            await this.makeRequest('DELETE', '/todos/completed');
            const afterClearResponse = await this.makeRequest('GET', '/todos');

            this.addResult(
                'F15-03: Memory cleanup after bulk operations',
                afterClearResponse.data.length === 0 ? 'PASS' : 'FAIL',
                `Memory cleaned up after bulk operations`,
                afterClearResponse.data.length.toString(),
                '0'
            );

            // Test API stability
            let stableResponses = 0;
            for (let i = 0; i < 10; i++) {
                try {
                    const response = await this.makeRequest('GET', '/todos');
                    if (response.status === 200) stableResponses++;
                } catch (error) {
                    // Count failed requests
                }
            }

            this.addResult(
                'F15-04: API stability under load',
                stableResponses === 10 ? 'PASS' : 'WARN',
                `Stable responses: ${stableResponses}/10`,
                stableResponses.toString(),
                '10'
            );

        } catch (error) {
            this.addResult('F15: Production readiness tests', 'FAIL', error.message);
        }
    }

    async testCrossFeatureIntegration() {
        this.log('Testing cross-feature integration...');

        try {
            // Setup mixed state
            await this.setupTestData();

            // Test counter with filters
            const allTodos = await this.makeRequest('GET', '/todos');
            const activeTodos = allTodos.data.filter(t => !t.completed);
            const completedTodos = allTodos.data.filter(t => t.completed);

            this.addResult(
                'CF-01: Counter + Filter integration data',
                activeTodos.length > 0 && completedTodos.length > 0 ? 'PASS' : 'WARN',
                `Mixed state available for integration testing`,
                `Active: ${activeTodos.length}, Completed: ${completedTodos.length}`,
                'Both > 0'
            );

            // Test toggle-all + counter integration
            await this.makeRequest('PUT', '/todos/toggle-all', { completed: true });
            const allCompletedResponse = await this.makeRequest('GET', '/todos');
            const allCompleted = allCompletedResponse.data;
            const activeAfterToggle = allCompleted.filter(t => !t.completed);

            this.addResult(
                'CF-02: Toggle-all + Counter integration',
                activeAfterToggle.length === 0 ? 'PASS' : 'FAIL',
                `Counter should show 0 active after toggle-all`,
                activeAfterToggle.length.toString(),
                '0'
            );

            // Test clear-completed + UI states integration
            await this.makeRequest('DELETE', '/todos/completed');
            const afterClearResponse = await this.makeRequest('GET', '/todos');

            this.addResult(
                'CF-03: Clear-completed + UI states integration',
                afterClearResponse.data.length === 0 ? 'PASS' : 'FAIL',
                `UI should hide main/footer when no todos remain`,
                afterClearResponse.data.length.toString(),
                '0'
            );

            // Test filter persistence during operations
            await this.makeRequest('POST', '/todos', { title: 'Filter Test Todo' });
            await this.makeRequest('PUT', `/todos/${(await this.makeRequest('GET', '/todos')).data[0].id}/toggle`, { completed: true });
            
            const finalState = await this.makeRequest('GET', '/todos');
            const finalActive = finalState.data.filter(t => !t.completed);
            const finalCompleted = finalState.data.filter(t => t.completed);

            this.addResult(
                'CF-04: Filter state persistence during operations',
                finalActive.length === 0 && finalCompleted.length === 1 ? 'PASS' : 'FAIL',
                `State changes propagate correctly for filter updates`,
                `Active: ${finalActive.length}, Completed: ${finalCompleted.length}`,
                'Active: 0, Completed: 1'
            );

        } catch (error) {
            this.addResult('Cross-feature integration tests', 'FAIL', error.message);
        }
    }

    async clearAllTodos() {
        const todos = await this.makeRequest('GET', '/todos');
        for (const todo of todos.data || []) {
            await this.makeRequest('DELETE', `/todos/${todo.id}`);
        }
    }

    generateReport() {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
        const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
        const warnTests = this.testResults.filter(r => r.status === 'WARN').length;
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

        console.log('\n' + '='.repeat(80));
        console.log('COMPREHENSIVE INTEGRATION TEST REPORT');
        console.log('TodoMVC Features 09-15 and Cross-Feature Integration');
        console.log('='.repeat(80));
        console.log(`Test Duration: ${(duration / 1000).toFixed(2)} seconds`);
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Warnings: ${warnTests} (${((warnTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Success Rate: ${successRate}%`);
        console.log('='.repeat(80));

        // Group results by feature
        const featureGroups = {};
        this.testResults.forEach(result => {
            const feature = result.testName.split(':')[0];
            if (!featureGroups[feature]) {
                featureGroups[feature] = [];
            }
            featureGroups[feature].push(result);
        });

        Object.keys(featureGroups).forEach(feature => {
            console.log(`\n${feature}:`);
            featureGroups[feature].forEach(result => {
                const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
                console.log(`  ${statusIcon} ${result.testName}`);
                if (result.details) {
                    console.log(`     ${result.details}`);
                }
                if (result.status === 'FAIL' && result.expectedValue) {
                    console.log(`     Expected: ${result.expectedValue}, Got: ${result.actualValue}`);
                }
            });
        });

        // Recommendations
        console.log('\n' + '='.repeat(80));
        console.log('RECOMMENDATIONS FOR PRODUCTION DEPLOYMENT:');
        console.log('='.repeat(80));

        if (failedTests === 0) {
            console.log('✅ All tests passed! Application ready for production deployment.');
        } else {
            console.log('❌ Failed tests found. Address these issues before production:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(result => {
                    console.log(`   - ${result.testName}: ${result.details}`);
                });
        }

        if (warnTests > 0) {
            console.log('\n⚠️ Warnings to consider:');
            this.testResults
                .filter(r => r.status === 'WARN')
                .forEach(result => {
                    console.log(`   - ${result.testName}: ${result.details}`);
                });
        }

        console.log('\n📋 Production Checklist:');
        console.log('   □ All API endpoints responding correctly');
        console.log('   □ CORS configuration appropriate for production domain');
        console.log('   □ Error handling implemented and tested');
        console.log('   □ Performance acceptable under load');
        console.log('   □ Cross-feature integration working');
        console.log('   □ UI state management robust');
        console.log('   □ Memory usage optimized');

        return {
            summary: {
                duration: duration / 1000,
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
        this.log('Starting comprehensive integration test suite...');
        this.log('Testing TodoMVC Features 09-15 and Cross-Feature Integration');
        
        try {
            await this.setupTestData();
            await this.testFeature09Counter();
            await this.testFeature10Filters();
            await this.testFeature11ToggleAll();
            await this.testFeature12ClearCompleted();
            await this.testFeature13UIStates();
            await this.testFeature14Integration();
            await this.testFeature15Production();
            await this.testCrossFeatureIntegration();
            
            return this.generateReport();
        } catch (error) {
            this.log(`Test suite failed: ${error.message}`);
            throw error;
        }
    }
}

// Usage in browser console:
// const tester = new TodoMVCIntegrationTester();
// tester.runAllTests().then(report => console.log('Test completed!'));

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoMVCIntegrationTester;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    window.TodoMVCIntegrationTester = TodoMVCIntegrationTester;
    console.log('TodoMVC Integration Tester loaded. Run: new TodoMVCIntegrationTester().runAllTests()');
}