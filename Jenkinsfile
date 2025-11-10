pipeline {
  agent any

  environment {
    DOCKER_IMAGE = "sibirassal/blue-green-demo"
    SSH_CRED = "ssh-server-creds"
    SERVER = "ubuntu@<your-server-ip>"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Image') {
      steps {
        script {
          bat """
          docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} .
          """
        }
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
          bat """
          echo %PASS% | docker login -u %USER% --password-stdin
          docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}
          """
        }
      }
    }

    stage('Blue-Green Deploy (Windows)') {
      steps {
        script {
          // Determine which environment is currently active
          def active = bat(script: 'type C:\\nginx\\active_env.txt', returnStdout: true).trim()
          echo "Currently active environment: ${active}"

          if (active == 'blue') {
            env.NEW = 'green'
            env.PORT = '5000'
          } else {
            env.NEW = 'blue'
            env.PORT = '4000'
          }

          // Pull and run the new container
          bat """
          docker pull sibirassal/blue-green-demo:${BUILD_NUMBER}
          docker rm -f %NEW% || exit 0
          docker run -d --name %NEW% -p %PORT%:3000 -e COLOR=%NEW% sibirassal/blue-green-demo:${BUILD_NUMBER}
          """

          // Health check using PowerShell
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

          // Write new active environment to file
          writeFile file: 'C:\\nginx\\active_env.txt', text: env.NEW

          // Remove old container
          bat """
          docker rm -f ${active} || exit 0
          """
        }
      }
    }
  }
}
