#!/usr/bin/env bash
# PreToolUse hook (Bash|PowerShell): impide operaciones destructivas de git
# sobre la rama protegida.
#
# Este proyecto trabaja directo sobre main, asi que los commits y los push
# normales NO se bloquean. Lo que se bloquea es lo que reescribe o borra
# historia ya publicada.
#
# Para pasar a modo estricto (bloquear tambien commit/push sobre main),
# agregar 'commit' y 'push' a DESTRUCTIVE_PATTERNS.
#
# Contrato: exit 2 = bloquear la llamada, stderr se le muestra a Claude.

set -uo pipefail

PROTECTED_BRANCH="${PROTECTED_BRANCH:-main}"

payload=$(cat)
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty')

[ -z "$command" ] && exit 0

# Solo nos interesan los comandos git.
printf '%s' "$command" | grep -qE '(^|[;&|]|\s)git\s' || exit 0

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
[ "$branch" != "$PROTECTED_BRANCH" ] && exit 0

# Ignorar el contenido de los strings entrecomillados: un commit message que
# menciona "reset --hard" no es un reset --hard.
scan=$(printf '%s' "$command" | sed -e "s/'[^']*'//g" -e 's/"[^"]*"//g')

# Patron => explicacion mostrada al bloquear.
check() {
  if printf '%s' "$scan" | grep -qE "$1"; then
    printf 'BLOQUEADO por guard-protected-branch: %s\n' "$2" >&2
    printf 'Rama actual: %s (protegida).\n' "$branch" >&2
    printf 'Si es intencional: crear una rama, o correr el comando fuera de Claude.\n' >&2
    exit 2
  fi
}

check 'push[^|;&]*--force(-with-lease)?|push[^|;&]*(\s|^)-f(\s|$)' 'force push sobre la rama protegida'
check 'reset[^|;&]*--hard'                                          'git reset --hard descarta cambios sin recuperacion'
check 'branch[^|;&]*-D'                                             'borrado forzado de rama'
check 'clean[^|;&]*-[a-z]*f'                                        'git clean -f borra archivos no trackeados'
check 'checkout[^|;&]*(\s|^)--(\s|$)|restore[^|;&]*--staged.*--worktree' 'descarta cambios del working tree'
check 'rebase|filter-branch|reflog\s+delete|update-ref\s+-d'        'reescritura de historia sobre la rama protegida'

exit 0