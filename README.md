# AWS SSM Start Port forward to remote host.


```bash
$ aws ssm start-session --target ${BASTION_INSTANCE_ID} \
--document-name AWS-StartPortForwardingSessionToRemoteHost \
--parameters '{"portNumber":["8080"],"localPortNumber":["9999"],"host":["${REMOTE_INSTANCE}"]}'

Starting session with SessionId: neil-xxxxxxxxxxxxxx
Port 9999 opened for sessionId neil-xxxxxxxxxxxxxx.
Waiting for connections...
```