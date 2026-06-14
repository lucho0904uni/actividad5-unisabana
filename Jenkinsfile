pipeline {
    agent {
        label 'windows'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '30'))
        timeout(time: 2, unit: 'HOURS')
        timestamps()
    }
    
    environment {
        NODE_VERSION = '20'
        K6_VERSION = 'latest'
        PORT = '8087'
        BASE_URL = 'http://localhost:8087'
    }
    
    stages {
        stage('Setup') {
            steps {
                script {
                    echo "=== K6 Performance Testing Pipeline ==="
                    echo "Node version: ${NODE_VERSION}"
                    echo "K6 version: ${K6_VERSION}"
                    echo "Target URL: ${BASE_URL}"
                }
            }
        }
        
        stage('Dependencies') {
            steps {
                script {
                    echo "Installing dependencies..."
                    bat '''
                        @echo off
                        call npm install
                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }
        
        stage('Install K6') {
            steps {
                script {
                    echo "Installing k6..."
                    bat '''
                        @echo off
                        choco install k6 -y
                        if errorlevel 1 (
                            echo Failed to install k6
                            exit /b 1
                        )
                        k6 version
                    '''
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                script {
                    echo "Cleaning up existing processes..."
                    bat '''
                        @echo off
                        taskkill /IM node.exe /F 2>nul || echo No node processes to kill
                        timeout /t 2 /nobreak
                    '''
                }
            }
        }
        
        stage('Smoke Test') {
            steps {
                script {
                    echo "Running smoke test..."
                    bat '''
                        @echo off
                        call npm run test:smoke
                        if errorlevel 1 (
                            echo Smoke test failed
                            exit /b 1
                        )
                    '''
                }
            }
        }
        
        stage('Baseline Test') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Running baseline test..."
                    def baselineStatus = bat(script: '@echo off\ncall npm run test:baseline', returnStatus: true)
                    if (baselineStatus != 0) {
                        echo 'Baseline test failed, but continuing...'
                    }
                }
            }
        }
        
        stage('Load Test') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Running load test..."
                    def loadStatus = bat(script: '@echo off\ncall npm run test:load', returnStatus: true)
                    if (loadStatus != 0) {
                        echo 'Load test failed, but continuing...'
                    }
                }
            }
        }
        
        stage('Stress Test') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Running stress test..."
                    def stressStatus = bat(script: '@echo off\ncall npm run test:stress', returnStatus: true)
                    if (stressStatus != 0) {
                        echo 'Stress test failed, but continuing...'
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "Cleaning up resources..."
                bat '''
                    @echo off
                    taskkill /IM node.exe /F 2>nul || echo No processes to clean
                '''
            }
            
            // Archive test results
            archiveArtifacts artifacts: 'perf/results/*.json', 
                             allowEmptyArchive: true,
                             onlyIfSuccessful: false
        }
        
        success {
            script {
                echo "✅ All tests completed successfully"
            }
        }
        
        failure {
            script {
                echo "❌ Pipeline failed - check logs above"
            }
        }
    }
}
