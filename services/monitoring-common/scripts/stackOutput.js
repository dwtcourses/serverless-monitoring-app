const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');
const os = require('os');
const DynamoDB = require('aws-sdk/clients/dynamodb');
const { writeItems } = require('aws-testing-library/lib/utils/dynamoDb');

const replaceInEnvFile = async (file, envs) => {
  const keys = Object.keys(envs);
  if (keys.length <= 0) {
    return;
  }

  const envFile = path.join(__dirname, '..', '..', '..', 'frontend', file);
  await fs.ensureFile(envFile);
  const content = await fs.readFile(envFile);
  const envConfig = await dotenv.parse(content);

  keys.forEach(key => {
    envConfig[key] = envs[key];
  });

  await fs.remove(envFile);
  await Promise.all(
    Object.keys(envConfig).map(key =>
      fs.appendFile(envFile, `${key}=${envConfig[key]}${os.EOL}`),
    ),
  );
};

const handler = async (data, serverless) => {
  //this handler creates the environment for the frontend based on the services deployment output
  const { UserPoolId, MonitoringDataTableName } = data;

  if (UserPoolId) {
    const region = serverless.variables.service.custom.currentRegion;
    await replaceInEnvFile('.env.local', {
      REACT_APP_USER_POOL_ID: UserPoolId,
      REACT_APP_COGNITO_REGION: region,
    });
  }

  if (MonitoringDataTableName) {
    const e2eConfigFile = path.join(
      __dirname,
      '..',
      '..',
      'monitoring-endpoints-tester-service',
      'e2e',
      'config.json',
    );
    const current = (await fs.readJson(e2eConfigFile, { throws: false })) || {};
    await fs.writeJSON(
      e2eConfigFile,
      {
        ...current,
        MonitoringDataTableName,
      },
      { spaces: 2 },
    );
  }
};

module.exports = { handler };
