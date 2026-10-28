#!/usr/bin/env sh
# Rechaza el commit si hay archivos de secretos en el área de preparación.
# Se usa como pre-commit en los tres repos (ver .githooks/pre-commit).
set -eu

prohibidos='(^|/)(\.env($|\.)|secrets/|.*\.(pem|key|p8|p12|pfx)$|.*credentials.*\.json$|.*service-account.*\.json$|id_(rsa|ed25519))'

archivos=$(git diff --cached --name-only --diff-filter=ACMR)
[ -z "$archivos" ] && exit 0

# Las plantillas *.example y la documentación de la carpeta secrets sí se permiten.
encontrados=$(printf '%s\n' "$archivos" | grep -E "$prohibidos" | grep -vE '\.example$|^secrets/README\.md$' || true)

if [ -n "$encontrados" ]; then
  echo "BLOQUEADO: estos archivos parecen secretos y no pueden ir a git:"
  printf '  %s\n' $encontrados
  echo "Los secretos viven solo en el VPS (/opt/elhincha/secrets)."
  exit 1
fi

# Busca valores sospechosos dentro del contenido agregado (sin revisarse a sí mismo,
# porque este archivo contiene los patrones que busca).
if git diff --cached -U0 -- . ':(exclude)scripts/check-no-secrets.sh' | grep -E '^\+' | grep -Eqi '(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|AccountTag|TunnelSecret|postgres(ql)?://[^:/]+:[^@]+@)'; then
  echo "BLOQUEADO: el cambio contiene algo que parece una credencial."
  exit 1
fi
