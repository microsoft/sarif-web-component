import { RepositoryDetails } from "./Viewer.Types";

// https://dev.azure.com/ OR https://org@dev.azure.com/
const AzureReposUrl = 'dev.azure.com/';

// git@ssh.dev.azure.com:v3/
const SSHAzureReposUrl = 'ssh.dev.azure.com:v3/';

// https://org.visualstudio.com/
const VSOUrl = '.visualstudio.com/';

// org@vs-ssh.visualstudio.com:v3/
const SSHVsoReposUrl = 'vs-ssh.visualstudio.com:v3/';

const failedToDetermineAzureRepoDetails: string = 'Failed to determine Azure Repo details from remote url. Please ensure that the remote points to a valid Azure Repos url.';
const notAzureRepoUrl: string = 'The repo isn\'t hosted with Azure Repos.';

export function isRepositoryDetailsComplete(repositoryDetails?: RepositoryDetails): boolean {
    return repositoryDetails
        && repositoryDetails.organizationName
        && repositoryDetails.projectName
        && repositoryDetails.repositoryName
        && !repositoryDetails.errorMessage;
}

export function getRepositoryDetailsFromRemoteUrl(remoteUrl: string): RepositoryDetails {
    if (remoteUrl.indexOf(AzureReposUrl) >= 0) {
        const part = remoteUrl.substring(remoteUrl.indexOf(AzureReposUrl) + AzureReposUrl.length);
        const parts = part.split('/');
        if (parts.length !== 4) {
            return { errorMessage: failedToDetermineAzureRepoDetails };
        }

        return {
            organizationName: parts[0].trim(),
            projectName: parts[1].trim(),
            repositoryName: parts[3].split('?')[0].trim()
        };
    } else if (remoteUrl.indexOf(VSOUrl) >= 0) {
        const part = remoteUrl.substring(remoteUrl.indexOf(VSOUrl) + VSOUrl.length);
        const organizationName = remoteUrl.substring(remoteUrl.indexOf('https://') + 'https://'.length, remoteUrl.indexOf('.visualstudio.com'));
        const parts = part.split('/');

        if (parts.length === 4 && parts[0].toLowerCase() === 'defaultcollection') {
            // Handle scenario where part is 'DefaultCollection/<project>/_git/<repository>'
            parts.shift();
        }

        if (parts.length !== 3) {
            return { errorMessage: failedToDetermineAzureRepoDetails };
        }

        return {
            organizationName: organizationName,
            projectName: parts[0].trim(),
            repositoryName: parts[2].split('?')[0].trim()
        };
    } else if (remoteUrl.indexOf(SSHAzureReposUrl) >= 0 || remoteUrl.indexOf(SSHVsoReposUrl) >= 0) {
        const urlFormat = remoteUrl.indexOf(SSHAzureReposUrl) >= 0 ? SSHAzureReposUrl : SSHVsoReposUrl;
        const part = remoteUrl.substring(remoteUrl.indexOf(urlFormat) + urlFormat.length);
        const parts = part.split('/');
        if (parts.length !== 3) {
            return { errorMessage: failedToDetermineAzureRepoDetails };
        }

        return {
            organizationName: parts[0].trim(),
            projectName: parts[1].trim(),
            repositoryName: parts[2].split('?')[0].trim()
        };
    } else {
        return { errorMessage: notAzureRepoUrl };
    }
}
