const { awscdk } = require("projen");
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: "2.25.0",
  defaultReleaseBranch: "main",
  name: "ssm-port-forward",
  deps: [
    'cdk-spot-one',
    'cdk-common',
    'typescript@4.6',
  ],
  projenVersion: '0.56',
  gitignore: ['cdk.context.json'],
});
project.synth();