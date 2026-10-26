# Staff Directory CI/CD
#
# build  — собирает backend (NestJS) и frontend (Vite), сохраняет dist/ как артефакты
# deploy — по SSH выкладывает сборку на сервер профиля вместе с env/.env.<profile>,
#          перезапускает сервисы и ждёт /actuator/health = UP
#
# Переменные (Settings → CI/CD → Variables, scope по environment test/preprod/prod):
#   SSH_PRIVATE_KEY  — приватный ключ деплой-пользователя (Protected)
#   SSH_KNOWN_HOSTS  — вывод `ssh-keyscan <host>`
#   DEPLOY_HOST      — хост сервера
#   DEPLOY_USER      — пользователь на сервере
#   DB_PASSWORD      — пароль БД (Masked, Protected); подставляется вместо ${DB_PASSWORD}

stages:
  - build
  - deploy

default:
  image: node:20-alpine

variables:
  npm_config_cache: "$CI_PROJECT_DIR/.npm"
  DEPLOY_PATH: /opt/staff-directory

# ─── Build ────────────────────────────────────────────────
build:backend:
  stage: build
  cache:
    key:
      prefix: backend
      files: [backend/package-lock.json]
    paths: [.npm/]
  script:
    - cd backend
    - npm ci
    - npm run build
  artifacts:
    paths: [backend/dist/]
    expire_in: 1 week

build:frontend:
  stage: build
  cache:
    key:
      prefix: frontend
      files: [frontend/package-lock.json]
    paths: [.npm/]
  script:
    - cd frontend
    - npm ci
    - npm run build
  artifacts:
    paths: [frontend/dist/]
    expire_in: 1 week

# ─── Deploy ───────────────────────────────────────────────
.deploy:
  stage: deploy
  image: alpine:3.20
  needs: [build:backend, build:frontend]
  resource_group: $CI_ENVIRONMENT_NAME
  before_script:
    - apk add --no-cache openssh-client rsync gettext
    - eval "$(ssh-agent -s)"
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh && chmod 700 ~/.ssh
    - echo "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts
  script:
    - ENV_FILE="env/.env.$APP_ENV"
    - TARGET="$DEPLOY_USER@$DEPLOY_HOST"
    - |
      if grep -q '\${DB_PASSWORD}' "$ENV_FILE" && [ -z "${DB_PASSWORD:-}" ]; then
        echo "DB_PASSWORD is not set for environment $CI_ENVIRONMENT_NAME"; exit 1
      fi
    # Подставляем только секреты, остальные значения остаются как в файле
    - envsubst '$DB_PASSWORD' < "$ENV_FILE" > .env.deploy
    - ssh "$TARGET" "mkdir -p $DEPLOY_PATH/backend $DEPLOY_PATH/frontend"
    - rsync -az --delete backend/dist "$TARGET:$DEPLOY_PATH/backend/"
    - rsync -az backend/package.json backend/package-lock.json "$TARGET:$DEPLOY_PATH/backend/"
    - rsync -az --delete frontend/dist "$TARGET:$DEPLOY_PATH/frontend/"
    - rsync -az frontend/vite.config.js frontend/package.json frontend/package-lock.json "$TARGET:$DEPLOY_PATH/frontend/"
    - rsync -az --chmod=F600 .env.deploy "$TARGET:$DEPLOY_PATH/.env"
    - |
      ssh "$TARGET" "set -e
        cd $DEPLOY_PATH/backend && npm ci --omit=dev
        # vite нужен для `vite preview`, поэтому ставим и devDependencies
        cd $DEPLOY_PATH/frontend && npm ci
        sudo systemctl restart staff-directory-backend staff-directory-frontend
        PORT=\$(grep -E '^PORT=' $DEPLOY_PATH/.env | cut -d= -f2)
        for i in \$(seq 1 30); do
          if curl -fsk https://localhost:\${PORT:-8478}/actuator/health; then exit 0; fi
          sleep 2
        done
        echo 'Health check failed'; exit 1"
  after_script:
    - rm -f .env.deploy

# test — автоматически после каждого коммита в основную ветку
deploy:test:
  extends: .deploy
  variables:
    APP_ENV: test
  environment:
    name: test
    url: https://$DEPLOY_HOST:8478
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

# preprod — вручную из основной ветки
deploy:preprod:
  extends: .deploy
  variables:
    APP_ENV: preprod
  environment:
    name: preprod
    url: https://$DEPLOY_HOST:8478
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual

# prod — вручную и только после успешного деплоя на preprod
deploy:prod:
  extends: .deploy
  variables:
    APP_ENV: prod
  environment:
    name: prod
    url: https://$DEPLOY_HOST:8478
  needs:
    - build:backend
    - build:frontend
    - job: deploy:preprod
      artifacts: false
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual


//
type DbEnvironment = 'test' | 'preprod' | 'prod';

const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'test')
  .toLowerCase() as DbEnvironment;

const getDatabaseUrl = (): string => {
  const envUrls: Record<DbEnvironment, string | undefined> = {
    test: process.env.DB_TEST_URL || process.env.DATABASE_URL,
    preprod: process.env.DB_PREPROD_URL,
    prod: process.env.DB_PROD_URL,
  };

  const selectedUrl = envUrls[appEnv];

  if (!selectedUrl) {
    throw new Error(
      `Missing database URL for environment "${appEnv}". Set DB_${appEnv.toUpperCase()}_URL or DATABASE_URL.`,
    );
  }

  return selectedUrl;
};

const getDatabaseSchema = (): string => {
  const schema = process.env.DB_SCHEMA || 'staff_directory';

  // The name is interpolated into DDL, so only plain identifiers are allowed
  if (!/^[a-z_][a-z0-9_]*$/i.test(schema)) {
    throw new Error(`Invalid DB_SCHEMA "${schema}". Use letters, digits and underscores only.`);
  }

  return schema;
};

/** Create the schema before Sequelize syncs models into it */
const ensureSchema = async (uri: string, schema: string): Promise<void> => {
  const sequelize = new Sequelize(uri, { dialect: 'postgres', logging: false });
  try {
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  } finally {
    await sequelize.close();
  }
};