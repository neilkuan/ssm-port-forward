import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { AWSManagedPolicies } from 'cdk-common';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, 'vpc', {
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'public-sb',
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          name: 'private-nat-sb',
        },
      ],
      natGateways: 1,
      maxAzs: 2,
    });
    const userData = ec2.UserData.forLinux();
    userData.addCommands(...[
      'sudo yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_arm64/amazon-ssm-agent.rpm',
      'sudo amazon-linux-extras install docker -y', 'sudo systemctl start docker', 'sudo docker run -d -p 8080:80 nginx',
    ]);
    const bastion = new ec2.Instance(this, 'BastionNode', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      instanceType: new ec2.InstanceType('t4g.micro'),
      userData,
    });
    const remoteNode = new ec2.Instance(this, 'remoteNode', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2, cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      instanceType: new ec2.InstanceType('t4g.micro'),
      userData,
    });
    bastion.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(AWSManagedPolicies.AMAZON_SSM_MANAGED_INSTANCE_CORE));
    remoteNode.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(AWSManagedPolicies.AMAZON_SSM_MANAGED_INSTANCE_CORE));
    remoteNode.connections.allowFrom(bastion, ec2.Port.tcp(8080));

    new CfnOutput(this, 'BastionId', {
      value: bastion.instanceId,
    });
    new CfnOutput(this, 'remoteNodeId', {
      value: remoteNode.instancePrivateDnsName,
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'my-stack-dev', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();