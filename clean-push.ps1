$ErrorActionPreference = "Stop"
Remove-Item -Path "hf-clean-deploy" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path "hf-clean-deploy"
Copy-Item -Path "server" -Destination "hf-clean-deploy\server" -Recurse -Exclude "node_modules"
Copy-Item -Path "Dockerfile" -Destination "hf-clean-deploy\"
Copy-Item -Path "README.md" -Destination "hf-clean-deploy\README.md" -ErrorAction SilentlyContinue
# Create a .gitignore in the deploy folder to be absolutely sure git doesn't pick up junk
"node_modules/`nserver/node_modules/`n*.sqlite`nuploads/" | Out-File -FilePath "hf-clean-deploy/.gitignore" -Encoding utf8
Remove-Item -Path "hf-clean-deploy\server\uploads" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "hf-clean-deploy\server\dev.sqlite" -Force -ErrorAction SilentlyContinue
Set-Location -Path "hf-clean-deploy"
git init
git config user.name "AI Deploy"
git config user.email "deploy@example.com"
git add .
git commit -m "Deploy clean backend"
# Use environment variable for token to avoid security leaks
$TOKEN = $env:HF_DEPLOY_TOKEN
if (-not $TOKEN) {
    Write-Error "HF_DEPLOY_TOKEN environment variable is not set. Please set it before running."
    exit 1
}
git push -f "https://yehia-ayman:$TOKEN@huggingface.co/spaces/yehia-ayman/peto-care-server" HEAD:main
Set-Location -Path ".."
Remove-Item -Path "hf-clean-deploy" -Recurse -Force
