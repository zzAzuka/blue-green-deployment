pipeline {
  agent any
  environment {
    DOCKER_IMAGE = "sibirassal/blue-green-demo"
    SSH_CRED = "ssh-server-creds"
    SERVER = "ubuntu@<your-server-ip>"
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Build Image') {
      steps {
        script {
          sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
        }
      }
    }
    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
          sh "echo $PASS | docker login -u $USER --password-stdin"
          sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
        }
      }
    }
    stage('Blue-Green Deploy (Windows)') {
  steps {
    script {
      def active = readFile('C:\\nginx\\active_env.txt').trim()
      if (active == 'blue') {
        env.NEW = 'green'
        env.PORT = '5000'
      } else {
        env.NEW = 'blue'
        env.PORT = '4000'
      }

      bat """
      docker pull sibirassal/blue-green-demo:${BUILD_NUMBER}
      docker rm -f %NEW% || true
      docker run -d --name %NEW% -p %PORT%:3000 -e COLOR=%NEW% sibirassal/blue-green-demo:${BUILD_NUMBER}
      """

      // Health check
      powershell """
      Start-Sleep -Seconds 5
      \$response = Invoke-WebRequest -Uri http://localhost:$env:PORT/health -UseBasicParsing
      if (\$response.StatusCode -ne 200) { exit 1 }
      """

      // Update Nginx config and reload
      powershell """
      (Get-Content 'C:\\nginx\\nginx-1.29.4\\conf\\nginx.conf') `
        -replace '127\\.0\\.0\\.1:4000', '127.0.0.1:$env:PORT' `
        -replace '127\\.0\\.0\\.1:5000', '127.0.0.1:$env:PORT' |
        Set-Content 'C:\\nginx\\nginx-1.29.4\\conf\\nginx.conf'

      & 'C:\\nginx\\nginx-1.29.4\\nginx.exe' -s reload
      """

      writeFile file: 'C:\\nginx\\active_env.txt', text: env.NEW

      bat "docker rm -f %ACTIVE% || true"
    }
  }
}

  }
}
