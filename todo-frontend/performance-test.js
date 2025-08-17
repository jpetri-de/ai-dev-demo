// Performance and Load Testing for TodoMVC Application
// Tests the application with large datasets and concurrent operations

class PerformanceTester {
    constructor() {
        this.apiUrl = 'http://localhost:8080/api';
        this.results = [];
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTime: 0,
            avgResponseTime: 0
        };
    }

    log(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    addResult(testName, status, details = '', metrics = {}) {
        this.results.push({
            testName,
            status,
            details,
            metrics,
            timestamp: new Date().toISOString()
        });
        
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        this.log(`${statusIcon} ${testName}: ${status} ${details ? `- ${details}` : ''}`);
    }

    async makeRequest(method, endpoint, body = null) {
        const url = `${this.apiUrl}${endpoint}`;
        const startTime = Date.now();
        
        try {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            
            if (body) {
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(url, options);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            this.metrics.totalRequests++;
            if (response.ok) {
                this.metrics.successfulRequests++;
            } else {
                this.metrics.failedRequests++;
            }
            
            this.metrics.totalTime += responseTime;
            this.metrics.avgResponseTime = this.metrics.totalTime / this.metrics.totalRequests;
            
            const data = response.status === 204 ? null : await response.json();
            return { status: response.status, data, responseTime };
        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            this.metrics.totalRequests++;
            this.metrics.failedRequests++;
            this.metrics.totalTime += responseTime;
            this.metrics.avgResponseTime = this.metrics.totalTime / this.metrics.totalRequests;
            
            throw new Error(`Request failed: ${error.message}`);
        }
    }

    async clearAllTodos() {
        const todos = await this.makeRequest('GET', '/todos');
        for (const todo of todos.data || []) {
            await this.makeRequest('DELETE', `/todos/${todo.id}`);
        }
    }

    async testLargeDatasetCreation() {
        this.log('Testing large dataset creation...');
        
        try {
            await this.clearAllTodos();
            
            const todoCount = 100;
            const startTime = Date.now();
            
            // Create todos sequentially to test database performance
            const todos = [];
            for (let i = 1; i <= todoCount; i++) {
                const todo = await this.makeRequest('POST', '/todos', {
                    title: `Performance Test Todo ${i.toString().padStart(3, '0')}`
                });
                todos.push(todo.data);
                
                if (i % 20 === 0) {
                    this.log(`Created ${i}/${todoCount} todos...`);
                }
            }
            
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTimePerTodo = totalTime / todoCount;
            
            this.addResult(
                'PERF-01: Large dataset creation',
                avgTimePerTodo < 50 ? 'PASS' : 'WARN',
                `Created ${todoCount} todos in ${totalTime}ms (avg: ${avgTimePerTodo.toFixed(2)}ms per todo)`,
                { totalTime, avgTimePerTodo, todoCount }
            );
            
            // Test reading large dataset
            const readStartTime = Date.now();
            const allTodos = await this.makeRequest('GET', '/todos');
            const readEndTime = Date.now();
            const readTime = readEndTime - readStartTime;
            
            this.addResult(
                'PERF-02: Large dataset retrieval',
                readTime < 500 ? 'PASS' : 'WARN',
                `Retrieved ${allTodos.data.length} todos in ${readTime}ms`,
                { readTime, todoCount: allTodos.data.length }
            );
            
            return todos;
        } catch (error) {
            this.addResult('Large dataset creation', 'FAIL', error.message);
            return [];
        }
    }

    async testConcurrentOperations() {
        this.log('Testing concurrent operations...');
        
        try {
            await this.clearAllTodos();
            
            // Test concurrent creation
            const concurrentCount = 50;
            const startTime = Date.now();
            
            const createPromises = Array(concurrentCount).fill().map((_, i) =>
                this.makeRequest('POST', '/todos', {
                    title: `Concurrent Test Todo ${i.toString().padStart(3, '0')}`
                })
            );
            
            const createResults = await Promise.allSettled(createPromises);
            const endTime = Date.now();
            const concurrentTime = endTime - startTime;
            
            const successful = createResults.filter(r => r.status === 'fulfilled').length;
            const failed = createResults.filter(r => r.status === 'rejected').length;
            
            this.addResult(
                'PERF-03: Concurrent creation',
                successful === concurrentCount ? 'PASS' : 'WARN',
                `${successful}/${concurrentCount} concurrent requests successful in ${concurrentTime}ms`,
                { concurrentTime, successful, failed, concurrentCount }
            );
            
            // Test concurrent reads
            const readStartTime = Date.now();
            const readPromises = Array(20).fill().map(() =>
                this.makeRequest('GET', '/todos')
            );
            
            const readResults = await Promise.allSettled(readPromises);
            const readEndTime = Date.now();
            const concurrentReadTime = readEndTime - readStartTime;
            
            const successfulReads = readResults.filter(r => r.status === 'fulfilled').length;
            
            this.addResult(
                'PERF-04: Concurrent reads',
                successfulReads === 20 ? 'PASS' : 'WARN',
                `${successfulReads}/20 concurrent reads successful in ${concurrentReadTime}ms`,
                { concurrentReadTime, successfulReads }
            );
            
        } catch (error) {
            this.addResult('Concurrent operations', 'FAIL', error.message);
        }
    }

    async testBulkOperations() {
        this.log('Testing bulk operations...');
        
        try {
            // Ensure we have todos to work with
            const todos = await this.testLargeDatasetCreation();
            
            if (todos.length === 0) {
                this.addResult('Bulk operations', 'FAIL', 'No todos available for bulk testing');
                return;
            }
            
            // Test toggle-all performance
            const toggleStartTime = Date.now();
            await this.makeRequest('PUT', '/todos/toggle-all', { completed: true });
            const toggleEndTime = Date.now();
            const toggleTime = toggleEndTime - toggleStartTime;
            
            this.addResult(
                'PERF-05: Bulk toggle operation',
                toggleTime < 1000 ? 'PASS' : 'WARN',
                `Toggle-all on ${todos.length} todos completed in ${toggleTime}ms`,
                { toggleTime, todoCount: todos.length }
            );
            
            // Test clear completed performance
            const clearStartTime = Date.now();
            await this.makeRequest('DELETE', '/todos/completed');
            const clearEndTime = Date.now();
            const clearTime = clearEndTime - clearStartTime;
            
            this.addResult(
                'PERF-06: Bulk clear operation',
                clearTime < 1000 ? 'PASS' : 'WARN',
                `Clear completed on ${todos.length} todos completed in ${clearTime}ms`,
                { clearTime, todoCount: todos.length }
            );
            
            // Verify all todos were cleared
            const remainingTodos = await this.makeRequest('GET', '/todos');
            
            this.addResult(
                'PERF-07: Bulk operation correctness',
                remainingTodos.data.length === 0 ? 'PASS' : 'FAIL',
                `${remainingTodos.data.length} todos remain after bulk clear`,
                { remaining: remainingTodos.data.length }
            );
            
        } catch (error) {
            this.addResult('Bulk operations', 'FAIL', error.message);
        }
    }

    async testMemoryAndResourceUsage() {
        this.log('Testing memory and resource usage...');
        
        try {
            // Create and delete cycles to test memory leaks
            const cycles = 5;
            const todosPerCycle = 50;
            
            for (let cycle = 1; cycle <= cycles; cycle++) {
                const cycleStartTime = Date.now();
                
                // Create todos
                const createPromises = Array(todosPerCycle).fill().map((_, i) =>
                    this.makeRequest('POST', '/todos', {
                        title: `Memory Test Cycle ${cycle} Todo ${i}`
                    })
                );
                
                await Promise.all(createPromises);
                
                // Delete all todos
                const todos = await this.makeRequest('GET', '/todos');
                const deletePromises = todos.data.map(todo =>
                    this.makeRequest('DELETE', `/todos/${todo.id}`)
                );
                
                await Promise.all(deletePromises);
                
                const cycleEndTime = Date.now();
                const cycleTime = cycleEndTime - cycleStartTime;
                
                this.log(`Memory test cycle ${cycle}/${cycles} completed in ${cycleTime}ms`);
            }
            
            // Verify no todos remain
            const finalTodos = await this.makeRequest('GET', '/todos');
            
            this.addResult(
                'PERF-08: Memory cleanup after cycles',
                finalTodos.data.length === 0 ? 'PASS' : 'FAIL',
                `${finalTodos.data.length} todos remain after ${cycles} create/delete cycles`,
                { cycles, todosPerCycle, remaining: finalTodos.data.length }
            );
            
            // Test response time stability
            const stableTestCount = 10;
            const responseTimes = [];
            
            for (let i = 0; i < stableTestCount; i++) {
                const response = await this.makeRequest('GET', '/todos');
                responseTimes.push(response.responseTime);
            }
            
            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const maxResponseTime = Math.max(...responseTimes);
            const minResponseTime = Math.min(...responseTimes);
            const variance = maxResponseTime - minResponseTime;
            
            this.addResult(
                'PERF-09: Response time stability',
                variance < 100 ? 'PASS' : 'WARN',
                `Avg: ${avgResponseTime.toFixed(2)}ms, Variance: ${variance}ms`,
                { avgResponseTime, maxResponseTime, minResponseTime, variance }
            );
            
        } catch (error) {
            this.addResult('Memory and resource usage', 'FAIL', error.message);
        }
    }

    async testEdgeCasePerformance() {
        this.log('Testing edge case performance...');
        
        try {
            // Test very long todo titles
            const longTitle = 'A'.repeat(1000);
            const longTitleStartTime = Date.now();
            const longTodo = await this.makeRequest('POST', '/todos', { title: longTitle });
            const longTitleEndTime = Date.now();
            const longTitleTime = longTitleEndTime - longTitleStartTime;
            
            this.addResult(
                'PERF-10: Long title handling',
                longTitleTime < 200 ? 'PASS' : 'WARN',
                `1000-character title processed in ${longTitleTime}ms`,
                { longTitleTime, titleLength: longTitle.length }
            );
            
            // Clean up
            if (longTodo.data) {
                await this.makeRequest('DELETE', `/todos/${longTodo.data.id}`);
            }
            
            // Test rapid sequential operations
            const rapidOpsCount = 100;
            const rapidStartTime = Date.now();
            
            for (let i = 0; i < rapidOpsCount; i++) {
                const todo = await this.makeRequest('POST', '/todos', { title: `Rapid ${i}` });
                await this.makeRequest('PUT', `/todos/${todo.data.id}/toggle`, { completed: true });
                await this.makeRequest('DELETE', `/todos/${todo.data.id}`);
            }
            
            const rapidEndTime = Date.now();
            const rapidTime = rapidEndTime - rapidStartTime;
            const avgRapidTime = rapidTime / rapidOpsCount;
            
            this.addResult(
                'PERF-11: Rapid sequential operations',
                avgRapidTime < 50 ? 'PASS' : 'WARN',
                `${rapidOpsCount} create-toggle-delete cycles in ${rapidTime}ms (avg: ${avgRapidTime.toFixed(2)}ms)`,
                { rapidTime, avgRapidTime, rapidOpsCount }
            );
            
        } catch (error) {
            this.addResult('Edge case performance', 'FAIL', error.message);
        }
    }

    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.status === 'PASS').length;
        const failedTests = this.results.filter(r => r.status === 'FAIL').length;
        const warnTests = this.results.filter(r => r.status === 'WARN').length;
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

        console.log('\n' + '='.repeat(80));
        console.log('PERFORMANCE AND RELIABILITY TEST REPORT');
        console.log('TodoMVC Application Load Testing');
        console.log('='.repeat(80));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Warnings: ${warnTests} (${((warnTests / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Success Rate: ${successRate}%`);
        console.log('='.repeat(80));
        
        console.log('\nOVERALL METRICS:');
        console.log(`Total API Requests: ${this.metrics.totalRequests}`);
        console.log(`Successful Requests: ${this.metrics.successfulRequests}`);
        console.log(`Failed Requests: ${this.metrics.failedRequests}`);
        console.log(`Average Response Time: ${this.metrics.avgResponseTime.toFixed(2)}ms`);
        console.log(`Success Rate: ${((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(1)}%`);

        // Detailed results
        console.log('\nDETAILED RESULTS:');
        this.results.forEach(result => {
            const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
            console.log(`${statusIcon} ${result.testName}`);
            if (result.details) {
                console.log(`   ${result.details}`);
            }
            if (result.metrics && Object.keys(result.metrics).length > 0) {
                console.log(`   Metrics: ${JSON.stringify(result.metrics)}`);
            }
        });

        // Performance recommendations
        console.log('\n' + '='.repeat(80));
        console.log('PERFORMANCE RECOMMENDATIONS:');
        console.log('='.repeat(80));

        if (failedTests === 0 && warnTests === 0) {
            console.log('✅ Excellent performance! Application handles load well.');
        } else {
            if (failedTests > 0) {
                console.log('❌ Performance issues found:');
                this.results
                    .filter(r => r.status === 'FAIL')
                    .forEach(result => {
                        console.log(`   - ${result.testName}: ${result.details}`);
                    });
            }
            
            if (warnTests > 0) {
                console.log('\n⚠️ Performance concerns:');
                this.results
                    .filter(r => r.status === 'WARN')
                    .forEach(result => {
                        console.log(`   - ${result.testName}: ${result.details}`);
                    });
            }
        }

        console.log('\n📊 Performance Benchmarks:');
        console.log('   □ Single request response time: < 50ms (excellent), < 200ms (good)');
        console.log('   □ Bulk operations: < 1000ms (good)');
        console.log('   □ Concurrent operations: 95%+ success rate');
        console.log('   □ Large dataset handling: 100+ items without degradation');
        console.log('   □ Memory stability: No leaks after create/delete cycles');

        return {
            summary: {
                totalTests,
                passedTests,
                failedTests,
                warnTests,
                successRate: parseFloat(successRate),
                metrics: this.metrics
            },
            results: this.results
        };
    }

    async runAllTests() {
        this.log('Starting Performance and Reliability Tests...');
        
        try {
            await this.testLargeDatasetCreation();
            await this.testConcurrentOperations();
            await this.testBulkOperations();
            await this.testMemoryAndResourceUsage();
            await this.testEdgeCasePerformance();
            
            return this.generateReport();
        } catch (error) {
            this.log(`Performance test suite failed: ${error.message}`);
            throw error;
        }
    }
}

// Export for usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceTester;
}

// Auto-run for Node.js
if (typeof module !== 'undefined' && require.main === module) {
    const tester = new PerformanceTester();
    tester.runAllTests().then(report => {
        console.log('Performance tests completed!');
        process.exit(0);
    }).catch(error => {
        console.error('Performance tests failed:', error);
        process.exit(1);
    });
}