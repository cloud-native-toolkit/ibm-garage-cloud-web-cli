# IBM Garage Cloud Native Toolkit Web CLI

Command-line tool to automate web tasks with puppeteer. The 
commands provided can be used directly from the command-line but 
most typically will be used in the context of a Job running in
a cluster to automate the configuration of a tool that cannot be
configured otherwise.

## Usage

1. Install the latest CLI by running:

    ```
    npm i -g @ibmgaragecloud/cloud-native-toolkit-web-cli
    ```
   
2. Run the following to list the available commands:

    ```
    igc-web --help
    ```

## Available commands

### jenkins-auth

In order to use the API calls with Jenkins, an API token must be generated. With the Helm
install of Jenkins, the only way to generate an API token is through the UI.

This command connects to a Jenkins instance and generates the API Token then creates
the `jenkins-config` and `jenkins-access` ConfigMap and Secret with the results.

#### Pre-requisites

The command assumes that the target cluster has already been configured or that the command is
running in a pod in the cluster and the `--inCluster` argument has been passed

#### Options

- `-n` - the namespace where Artifactory has been installed. If not provided defaults to `tools`
- `--inCluster` - a flag indicating that the command is running within a pod in the cluster. If 
the flag is set, the command will retrieve the kube config from the cluster and will use the
internal url to connect to the Artifactory instance

### setup-artifactory

The OpenSource version of Artifactory has limited API support for configuring
the Artifactory instance after deployment. At a minimum, there are a number of 
tasks that must be done manually to make the instance ready for use:

1. Reset the admin password
2. Set the base url of the instance
3. Configure the repositories
4. Retrieve the encrypted password for use with the Artifactory APIS

This command will read the Artifactory configuration information from the 
`artifactory-access` secret, log in to the Artifactory UI using puppeteer and
complete a number of configuration steps, then update the `artifactory-access`
secret with the results of the automation.

#### Pre-requisites

The command assumes that the target cluster has already been configured or that the command is
running in a pod in the cluster and the `--inCluster` argument has been passed

#### Options

- `-n` - the namespace where Artifactory has been installed. If not provided defaults to `tools`
- `--inCluster` - a flag indicating that the command is running within a pod in the cluster. If 
the flag is set, the command will retrieve the kube config from the cluster and will use the
internal url to connect to the Artifactory instance

#### Example usage

```shell script
igc-web setup-artifactory -n tools
```

### setup-sonarqube

The SonarQube helm package does not expose a mechanism to provide a password during the install process. As such, every
new instance of SonarQube has the username and password set to `admin`/`admin`. In order to change the password, one must
log into the console and change it via the UI. Additionally, an API token can be used when interacting with SonarQube that
provides added security by not exposing the user password. The only way to generate the token is via the UI.

There are two actions that need to be performed to set up SonarQube:

- Change the password to a more complex one
- Generate an authentication token

This command will read the SonarQube configuration information from the 
`sonarqube-access` secret, log in to the SonarQube UI using puppeteer and
reset the password, then update the `sonarqube-access` secret with the results of the automation.

#### Pre-requisites

The command assumes that the target cluster has already been configured or that the command is
running in a pod in the cluster and the `--inCluster` argument has been passed

#### Options

- `-n` - the namespace where SonarQube has been installed. If not provided defaults to `tools`
- `--inCluster` - a flag indicating that the command is running within a pod in the cluster. If 
the flag is set, the command will retrieve the kube config from the cluster and will use the
internal url to connect to the SonarQube instance

#### Example usage

```shell script
igc-web setup-sonarqube -n tools
```

## Development

### Run the tests

```shell script
npm test
```

### Run the cli locally

```shell script
./igc-web
```
