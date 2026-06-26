import type * as Monaco from 'monaco-editor'

// ── Sentinel Tables with Columns ─────────────────────────────────────────────

export const SENTINEL_SCHEMA: Record<string, string[]> = {
  // ── Identity & Authentication ──────────────────────────────────────────────
  SigninLogs: [
    'TimeGenerated', 'OperationName', 'Category', 'ResultType', 'ResultDescription',
    'CorrelationId', 'Identity', 'Level', 'Location', 'AlternateSignInName',
    'AppDisplayName', 'AppId', 'AuthenticationDetails', 'AuthenticationMethodsUsed',
    'AuthenticationProcessingDetails', 'AuthenticationRequirement',
    'ClientAppUsed', 'ConditionalAccessPolicies', 'ConditionalAccessStatus',
    'CreatedDateTime', 'DeviceDetail', 'Id', 'IPAddress', 'IsInteractive',
    'MfaDetail', 'NetworkLocationDetails', 'OriginalRequestId',
    'ProcessingTimeInMilliseconds', 'ResourceDisplayName', 'ResourceId',
    'RiskDetail', 'RiskEventTypes', 'RiskEventTypes_V2', 'RiskLevelAggregated',
    'RiskLevelDuringSignIn', 'RiskState', 'ServicePrincipalId',
    'ServicePrincipalName', 'Status', 'TokenIssuerName', 'TokenIssuerType',
    'UserAgent', 'UserDisplayName', 'UserId', 'UserPrincipalName', 'UserType',
    'AutonomousSystemNumber', 'CrossTenantAccessType', 'FlaggedForReview',
    'HomeTenantId', 'IncomingTokenType', 'ManagedServiceIdentity',
    'PrivateLinkDetails', 'ResourceServicePrincipalId', 'SessionLifetimePolicies',
    'SignInIdentifier', 'SignInIdentifierType', 'TenantId', 'UniqueTokenIdentifier',
  ],

  AADNonInteractiveUserSignInLogs: [
    'TimeGenerated', 'OperationName', 'Category', 'ResultType', 'ResultDescription',
    'CorrelationId', 'Identity', 'AppDisplayName', 'AppId', 'AuthenticationProtocol',
    'AuthenticationRequirement', 'ClientAppUsed', 'ConditionalAccessPolicies',
    'ConditionalAccessStatus', 'CreatedDateTime', 'DeviceDetail', 'FederatedCredentialId',
    'HomeTenantId', 'Id', 'IPAddress', 'IncomingTokenType', 'MfaDetail',
    'NetworkLocationDetails', 'OriginalRequestId', 'ProcessingTimeInMilliseconds',
    'ResourceDisplayName', 'ResourceId', 'ResourceServicePrincipalId',
    'ResourceTenantId', 'RiskDetail', 'RiskEventTypes_V2', 'RiskLevelAggregated',
    'RiskLevelDuringSignIn', 'RiskState', 'ServicePrincipalCredentialKeyId',
    'ServicePrincipalCredentialThumbprint', 'ServicePrincipalId',
    'ServicePrincipalName', 'SignInEventTypes', 'Status', 'TokenIssuerName',
    'TokenIssuerType', 'UniqueTokenIdentifier', 'UserDisplayName', 'UserId',
    'UserPrincipalName', 'UserType',
  ],

  AADServicePrincipalSignInLogs: [
    'TimeGenerated', 'OperationName', 'Category', 'ResultType', 'ResultDescription',
    'CorrelationId', 'AppId', 'AuthenticationProtocol', 'ConditionalAccessPolicies',
    'ConditionalAccessStatus', 'CreatedDateTime', 'FederatedCredentialId', 'Id',
    'IPAddress', 'IncomingTokenType', 'MfaDetail', 'OriginalRequestId',
    'ProcessingTimeInMilliseconds', 'ResourceDisplayName', 'ResourceId',
    'ResourceServicePrincipalId', 'ResourceTenantId', 'ServicePrincipalCredentialKeyId',
    'ServicePrincipalCredentialThumbprint', 'ServicePrincipalId', 'ServicePrincipalName',
    'SignInEventTypes', 'Status', 'TokenIssuerName', 'UniqueTokenIdentifier',
  ],

  AADManagedIdentitySignInLogs: [
    'TimeGenerated', 'OperationName', 'Category', 'ResultType', 'ResultDescription',
    'CorrelationId', 'AppId', 'AuthenticationProcessingDetails', 'ConditionalAccessPolicies',
    'ConditionalAccessStatus', 'CreatedDateTime', 'FederatedCredentialId', 'Id',
    'IPAddress', 'ManagedIdentityType', 'OriginalRequestId', 'ResourceDisplayName',
    'ResourceId', 'ResourceServicePrincipalId', 'ResourceTenantId',
    'ServicePrincipalCredentialKeyId', 'ServicePrincipalId', 'ServicePrincipalName',
    'SignInEventTypes', 'Status', 'TokenIssuerName', 'UniqueTokenIdentifier',
  ],

  AuditLogs: [
    'TimeGenerated', 'OperationName', 'Category', 'Result', 'ResultReason',
    'CorrelationId', 'Identity', 'Level', 'AdditionalDetails', 'Id',
    'InitiatedBy', 'LoggedByService', 'OperationType', 'TargetResources',
    'ActivityDateTime', 'ActivityDisplayName',
  ],

  IdentityLogonEvents: [
    'TimeGenerated', 'ActionType', 'Application', 'DestinationDeviceName',
    'DestinationIPAddress', 'DestinationPort', 'DeviceName', 'FailureReason',
    'ISP', 'IPAddress', 'IsLocalAdmin', 'Location', 'LogonType',
    'OSPlatform', 'Port', 'Protocol', 'ReportId', 'TargetAccountDisplayName',
    'TargetAccountUpn', 'TargetDeviceName', 'Timestamp',
  ],

  IdentityQueryEvents: [
    'TimeGenerated', 'ActionType', 'Application', 'DestinationDeviceName',
    'DestinationIPAddress', 'DeviceName', 'IPAddress', 'Location', 'OSPlatform',
    'Port', 'Protocol', 'QueryTarget', 'QueryType', 'ReportId', 'Timestamp',
  ],

  IdentityDirectoryEvents: [
    'TimeGenerated', 'ActionType', 'Application', 'DestinationDeviceName',
    'DestinationIPAddress', 'DeviceName', 'IPAddress', 'Location', 'OSPlatform',
    'Protocol', 'ReportId', 'TargetAccountDisplayName', 'TargetAccountUpn',
    'TargetDeviceName', 'Timestamp',
  ],

  BehaviorAnalytics: [
    'TimeGenerated', 'ActivityInsights', 'ActivityType', 'DevicesInsights',
    'EventName', 'InvestigationPriority', 'SourceComputerId', 'SourceIPAddress',
    'SourceIPLocation', 'SourceRecordId', 'TimeProcessed', 'UserName',
    'UserPrincipalName', 'UsersInsights', 'WorkspaceTenantId',
  ],

  // ── Security Alerts & Incidents ───────────────────────────────────────────
  SecurityAlert: [
    'TimeGenerated', 'AlertName', 'AlertSeverity', 'AlertType', 'ConfidenceLevel',
    'ConfidenceScore', 'Description', 'DisplayName', 'EndTime', 'Entities',
    'ExtendedLinks', 'ExtendedProperties', 'IsIncident', 'ProcessingEndTime',
    'ProductComponentName', 'ProductName', 'ProviderName', 'RemediationSteps',
    'ResourceId', 'StartTime', 'Status', 'SystemAlertId', 'Tactics', 'Techniques',
    'VendorName', 'WorkspaceSubscriptionId', 'WorkspaceResourceGroup',
  ],

  SecurityIncident: [
    'TimeGenerated', 'AdditionalData', 'AlertIds', 'BookmarkIds', 'Classification',
    'ClassificationComment', 'ClassificationReason', 'ClosedTime', 'Comments',
    'CreatedTime', 'Description', 'FirstActivityTime', 'IncidentName',
    'IncidentNumber', 'IncidentUrl', 'Labels', 'LastActivityTime',
    'LastModifiedTime', 'ModifiedBy', 'Owner', 'RelatedAnalyticRuleIds',
    'Severity', 'SourceSystem', 'Status', 'Tasks', 'TeamId', 'TeamName',
    'TenantId', 'Title',
  ],

  // ── Windows Security Events ───────────────────────────────────────────────
  SecurityEvent: [
    'TimeGenerated', 'EventID', 'EventSourceName', 'Activity', 'Account',
    'AccountType', 'Computer', 'EventData', 'LogonGuid', 'LogonProcessName',
    'LogonType', 'LogonTypeName', 'MemberName', 'MemberSid', 'NewProcessId',
    'NewProcessName', 'ObjectName', 'ObjectServer', 'ObjectType',
    'ParentProcessName', 'Process', 'ProcessId', 'ProcessName',
    'ServiceFileName', 'ServiceName', 'ServiceStartType', 'ServiceType',
    'ShareLocalPath', 'ShareName', 'Status', 'SubjectDomainName',
    'SubjectLogonId', 'SubjectUserName', 'SubjectUserSid',
    'TargetAccount', 'TargetDomainName', 'TargetLogonId', 'TargetServerName',
    'TargetSid', 'TargetUserName', 'TargetUserSid', 'TaskName',
    'IpAddress', 'IpPort', 'WorkstationName', 'SourceComputerId',
    'PrivilegeList', 'AuditPolicyChanges', 'AuthenticationPackageName',
    'LmPackageName', 'TransmittedServices', 'KeyLength',
  ],

  WindowsEvent: [
    'TimeGenerated', 'Channel', 'Computer', 'Correlation', 'EventData',
    'EventID', 'EventLevelName', 'EventOriginId', 'EventRecordId',
    'Keywords', 'ManagementGroupName', 'Opcode', 'Provider', 'RenderingInfo',
    'SystemUserId', 'Task', 'TimeCreated', 'Version',
  ],

  // ── Syslog & CEF ─────────────────────────────────────────────────────────
  Syslog: [
    'TimeGenerated', 'Computer', 'EventTime', 'Facility', 'HostIP',
    'HostName', 'ProcessID', 'ProcessName', 'SeverityLevel', 'SourceSystem',
    'SyslogMessage',
  ],

  CommonSecurityLog: [
    'TimeGenerated', 'Activity', 'AdditionalExtensions', 'ApplicationProtocol',
    'CommunicationDirection', 'Computer', 'DestinationDnsDomain',
    'DestinationHostName', 'DestinationIP', 'DestinationMACAddress',
    'DestinationNTDomain', 'DestinationPort', 'DestinationServiceName',
    'DestinationTranslatedAddress', 'DestinationTranslatedPort',
    'DestinationUserID', 'DestinationUserName', 'DestinationUserPrivileges',
    'DeviceAction', 'DeviceAddress', 'DeviceCustomDate1', 'DeviceCustomDate2',
    'DeviceCustomIPv6Address1', 'DeviceCustomIPv6Address2',
    'DeviceCustomNumber1', 'DeviceCustomNumber2', 'DeviceCustomNumber3',
    'DeviceCustomString1', 'DeviceCustomString2', 'DeviceCustomString3',
    'DeviceCustomString4', 'DeviceCustomString5', 'DeviceCustomString6',
    'DeviceDnsDomain', 'DeviceEventCategory', 'DeviceEventClassID',
    'DeviceExternalID', 'DeviceFacility', 'DeviceHostName', 'DeviceInboundInterface',
    'DeviceMACAddress', 'DeviceName', 'DeviceNtDomain', 'DeviceOutboundInterface',
    'DevicePayloadId', 'DeviceProduct', 'DeviceTranslatedAddress',
    'DeviceTranslatedZone', 'DeviceVendor', 'DeviceVersion', 'DeviceZone',
    'EndTime', 'EventCount', 'EventOutcome', 'EventType', 'ExternalID',
    'FileCreateTime', 'FileHash', 'FileID', 'FileModificationTime',
    'FilePath', 'FilePermission', 'FileSize', 'FileType', 'FlexDate1',
    'FlexNumber1', 'FlexNumber2', 'FlexString1', 'FlexString2',
    'LogSeverity', 'MaliciousIP', 'Message', 'OldFileCreateTime',
    'OldFileHash', 'OldFileID', 'OldFileModificationTime', 'OldFileName',
    'OldFilePath', 'OldFilePermission', 'OldFileSize', 'OldFileType',
    'OriginalLogSeverity', 'ProcessID', 'ProcessName', 'Protocol',
    'Reason', 'ReceiptTime', 'ReceivedBytes', 'RemoteIP', 'RemotePort',
    'RequestClientApplication', 'RequestContext', 'RequestCookies',
    'RequestMethod', 'RequestURL', 'SentBytes', 'SimplifiedDeviceAction',
    'SourceDnsDomain', 'SourceHostName', 'SourceIP', 'SourceMACAddress',
    'SourceNTDomain', 'SourcePort', 'SourceServiceName',
    'SourceTranslatedAddress', 'SourceTranslatedPort',
    'SourceUserID', 'SourceUserName', 'SourceUserPrivileges',
    'StartTime', 'ThreatConfidence', 'ThreatDescription',
    'ThreatExternalID', 'ThreatSeverity',
  ],

  // ── Azure Activity ────────────────────────────────────────────────────────
  AzureActivity: [
    'TimeGenerated', 'Authorization', 'Caller', 'CallerIpAddress', 'Category',
    'Claims', 'CorrelationId', 'Description', 'HTTPRequest', 'Level',
    'OperationId', 'OperationName', 'OperationNameValue', 'Properties',
    'ResourceGroup', 'ResourceId', 'ResourceProvider', 'ResourceProviderValue',
    'ResourceType', 'SourceSystem', 'Status', 'StatusCode', 'SubStatus',
    'SubscriptionId', 'TenantId', 'Type',
  ],

  AzureDiagnostics: [
    'TimeGenerated', 'Category', 'CorrelationId', 'Level', 'OperationName',
    'Properties', 'Resource', 'ResourceGroup', 'ResourceId', 'ResourceProvider',
    'ResourceType', 'ResultDescription', 'ResultSignature', 'ResultType',
    'SourceSystem', 'SubscriptionId', 'TenantId',
  ],

  // ── Microsoft 365 ─────────────────────────────────────────────────────────
  OfficeActivity: [
    'TimeGenerated', 'ClientIP', 'CreationTime', 'Id', 'ObjectId',
    'Operation', 'OrganizationId', 'RecordType', 'ResultStatus',
    'Sensitivity', 'SharePointMetaData', 'Site_Url', 'SourceFileName',
    'SourceFileExtension', 'SourceRelativeUrl', 'UserId', 'UserKey',
    'UserType', 'Version', 'Workload', 'DestinationFileName',
    'DestinationFileExtension', 'DestinationRelativeUrl',
    'OfficeObjectId', 'OfficeWorkload', 'UserAgent',
    'ExternalAccess', 'TargetUserOrGroupName', 'TargetUserOrGroupType',
    'EventSource', 'ItemType', 'ListId', 'ListItemUniqueId',
    'MachineDomainInfo', 'MachineId', 'SiteUrl', 'TargetContextId',
    'TeamName', 'TeamGuid', 'ChannelName', 'ChannelGuid',
    'ExtraProperties', 'MessageSizeBytes', 'Recipients',
    'SenderMailFromAddress', 'Subject',
  ],

  MicrosoftGraphActivityLogs: [
    'TimeGenerated', 'ApiVersion', 'AppId', 'AtContent', 'ClientAuthMethod',
    'DurationMs', 'Id', 'IPAddress', 'Location', 'OperationId',
    'RequestMethod', 'RequestUri', 'ResponseStatusCode',
    'Roles', 'Scopes', 'ServicePrincipalId', 'SignInActivityId',
    'TenantId', 'TokenIssuedAt', 'UserAgent', 'UserId', 'Wids',
  ],

  // ── Microsoft Defender XDR ────────────────────────────────────────────────
  DeviceEvents: [
    'TimeGenerated', 'ActionType', 'AccountDomain', 'AccountName', 'AccountObjectId',
    'AccountSid', 'AccountUpn', 'AdditionalFields', 'AppGuardContainerId',
    'DeviceId', 'DeviceName', 'FileName', 'FileSize', 'FolderPath',
    'InitiatingProcessAccountDomain', 'InitiatingProcessAccountName',
    'InitiatingProcessAccountObjectId', 'InitiatingProcessAccountSid',
    'InitiatingProcessAccountUpn', 'InitiatingProcessCommandLine',
    'InitiatingProcessCreationTime', 'InitiatingProcessFileName',
    'InitiatingProcessFolderPath', 'InitiatingProcessId',
    'InitiatingProcessIntegrityLevel', 'InitiatingProcessMD5',
    'InitiatingProcessParentCreationTime', 'InitiatingProcessParentFileName',
    'InitiatingProcessParentId', 'InitiatingProcessSHA1',
    'InitiatingProcessSHA256', 'InitiatingProcessTokenElevation',
    'LocalIP', 'LocalIPType', 'LocalPort', 'MD5', 'MachineGroup',
    'ProcessCreationTime', 'ProcessId', 'ProcessTokenElevation',
    'RemoteIP', 'RemoteIPType', 'RemotePort', 'RemoteUrl', 'ReportId',
    'RequestAccountDomain', 'RequestAccountName', 'RequestAccountSid',
    'RequestProtocol', 'RequestSourceIP', 'RequestSourcePort',
    'RequestTargetName', 'SHA1', 'SHA256', 'SensitivityLabel',
    'SensitivitySubLabel', 'Timestamp',
  ],

  DeviceProcessEvents: [
    'TimeGenerated', 'AccountDomain', 'AccountName', 'AccountObjectId',
    'AccountSid', 'AccountUpn', 'ActionType', 'AdditionalFields',
    'AppGuardContainerId', 'DeviceId', 'DeviceName', 'FileName',
    'FileSize', 'FolderPath', 'InitiatingProcessAccountDomain',
    'InitiatingProcessAccountName', 'InitiatingProcessAccountObjectId',
    'InitiatingProcessAccountSid', 'InitiatingProcessAccountUpn',
    'InitiatingProcessCommandLine', 'InitiatingProcessCreationTime',
    'InitiatingProcessFileName', 'InitiatingProcessFolderPath',
    'InitiatingProcessId', 'InitiatingProcessIntegrityLevel',
    'InitiatingProcessMD5', 'InitiatingProcessParentCreationTime',
    'InitiatingProcessParentFileName', 'InitiatingProcessParentId',
    'InitiatingProcessSHA1', 'InitiatingProcessSHA256',
    'InitiatingProcessSignatureStatus', 'InitiatingProcessSignerType',
    'InitiatingProcessTokenElevation', 'IntegrityLevel', 'MD5',
    'MachineGroup', 'ProcessCommandLine', 'ProcessCreationTime',
    'ProcessId', 'ProcessIntegrityLevel', 'ProcessTokenElevation',
    'ProcessVersionInfoCompanyName', 'ProcessVersionInfoFileDescription',
    'ProcessVersionInfoInternalFileName', 'ProcessVersionInfoOriginalFileName',
    'ProcessVersionInfoProductName', 'ProcessVersionInfoProductVersion',
    'ReportId', 'SHA1', 'SHA256', 'SignatureStatus', 'SignerType', 'Timestamp',
  ],

  DeviceNetworkEvents: [
    'TimeGenerated', 'AccountDomain', 'AccountName', 'AccountObjectId',
    'AccountSid', 'AccountUpn', 'ActionType', 'AdditionalFields',
    'AppGuardContainerId', 'DeviceId', 'DeviceName',
    'InitiatingProcessAccountDomain', 'InitiatingProcessAccountName',
    'InitiatingProcessAccountObjectId', 'InitiatingProcessAccountSid',
    'InitiatingProcessAccountUpn', 'InitiatingProcessCommandLine',
    'InitiatingProcessCreationTime', 'InitiatingProcessFileName',
    'InitiatingProcessFolderPath', 'InitiatingProcessId',
    'InitiatingProcessMD5', 'InitiatingProcessParentFileName',
    'InitiatingProcessParentId', 'InitiatingProcessSHA1',
    'InitiatingProcessSHA256', 'LocalIP', 'LocalIPType',
    'LocalPort', 'MachineGroup', 'Protocol', 'RemoteIP', 'RemoteIPType',
    'RemotePort', 'RemoteUrl', 'ReportId', 'Timestamp',
  ],

  DeviceFileEvents: [
    'TimeGenerated', 'ActionType', 'AdditionalFields', 'AppGuardContainerId',
    'DeviceId', 'DeviceName', 'FileName', 'FileOriginIP', 'FileOriginReferrerUrl',
    'FileOriginUrl', 'FileSize', 'FolderPath', 'InitiatingProcessAccountDomain',
    'InitiatingProcessAccountName', 'InitiatingProcessAccountObjectId',
    'InitiatingProcessAccountSid', 'InitiatingProcessAccountUpn',
    'InitiatingProcessCommandLine', 'InitiatingProcessCreationTime',
    'InitiatingProcessFileName', 'InitiatingProcessFolderPath',
    'InitiatingProcessId', 'InitiatingProcessIntegrityLevel',
    'InitiatingProcessMD5', 'InitiatingProcessParentCreationTime',
    'InitiatingProcessParentFileName', 'InitiatingProcessParentId',
    'InitiatingProcessSHA1', 'InitiatingProcessSHA256',
    'InitiatingProcessTokenElevation', 'IsAzureInfoProtectionApplied',
    'MD5', 'MachineGroup', 'PreviousFileName', 'PreviousFolderPath',
    'ReportId', 'RequestAccountDomain', 'RequestAccountName',
    'RequestAccountSid', 'RequestProtocol', 'RequestSourceIP',
    'RequestSourcePort', 'SensitivityLabel', 'SensitivitySubLabel',
    'SHA1', 'SHA256', 'ShareName', 'Timestamp',
  ],

  DeviceRegistryEvents: [
    'TimeGenerated', 'ActionType', 'AdditionalFields', 'AppGuardContainerId',
    'DeviceId', 'DeviceName', 'InitiatingProcessAccountDomain',
    'InitiatingProcessAccountName', 'InitiatingProcessAccountObjectId',
    'InitiatingProcessAccountSid', 'InitiatingProcessAccountUpn',
    'InitiatingProcessCommandLine', 'InitiatingProcessCreationTime',
    'InitiatingProcessFileName', 'InitiatingProcessFolderPath',
    'InitiatingProcessId', 'InitiatingProcessIntegrityLevel',
    'InitiatingProcessMD5', 'InitiatingProcessParentCreationTime',
    'InitiatingProcessParentFileName', 'InitiatingProcessParentId',
    'InitiatingProcessSHA1', 'InitiatingProcessSHA256',
    'InitiatingProcessTokenElevation', 'MachineGroup',
    'PreviousRegistryKey', 'PreviousRegistryValueData',
    'PreviousRegistryValueName', 'RegistryKey', 'RegistryValueData',
    'RegistryValueName', 'RegistryValueType', 'ReportId', 'Timestamp',
  ],

  DeviceLogonEvents: [
    'TimeGenerated', 'AccountDomain', 'AccountName', 'AccountObjectId',
    'AccountSid', 'AccountUpn', 'ActionType', 'AdditionalFields',
    'AppGuardContainerId', 'DeviceId', 'DeviceName', 'FailureReason',
    'InitiatingProcessAccountDomain', 'InitiatingProcessAccountName',
    'InitiatingProcessAccountObjectId', 'InitiatingProcessAccountSid',
    'InitiatingProcessAccountUpn', 'InitiatingProcessCommandLine',
    'InitiatingProcessCreationTime', 'InitiatingProcessFileName',
    'InitiatingProcessFolderPath', 'InitiatingProcessId',
    'InitiatingProcessMD5', 'InitiatingProcessParentCreationTime',
    'InitiatingProcessParentFileName', 'InitiatingProcessParentId',
    'InitiatingProcessSHA1', 'InitiatingProcessSHA256',
    'InitiatingProcessTokenElevation', 'IsLocalAdmin', 'LogonId',
    'LogonType', 'MachineGroup', 'Protocol', 'RemoteDeviceName',
    'RemoteIP', 'RemoteIPType', 'RemotePort', 'ReportId', 'Timestamp',
  ],

  DeviceImageLoadEvents: [
    'TimeGenerated', 'ActionType', 'AdditionalFields', 'AppGuardContainerId',
    'DeviceId', 'DeviceName', 'FileName', 'FolderPath',
    'InitiatingProcessAccountDomain', 'InitiatingProcessAccountName',
    'InitiatingProcessAccountObjectId', 'InitiatingProcessAccountSid',
    'InitiatingProcessAccountUpn', 'InitiatingProcessCommandLine',
    'InitiatingProcessCreationTime', 'InitiatingProcessFileName',
    'InitiatingProcessFolderPath', 'InitiatingProcessId',
    'InitiatingProcessMD5', 'InitiatingProcessParentCreationTime',
    'InitiatingProcessParentFileName', 'InitiatingProcessParentId',
    'InitiatingProcessSHA1', 'InitiatingProcessSHA256',
    'InitiatingProcessTokenElevation', 'MD5', 'MachineGroup',
    'ReportId', 'SHA1', 'SHA256', 'SignatureStatus', 'SignerType', 'Timestamp',
  ],

  DeviceInfo: [
    'TimeGenerated', 'AadDeviceId', 'AssetValue', 'ClientVersion',
    'DeviceCategory', 'DeviceId', 'DeviceName', 'DeviceObjectId',
    'DeviceSubtype', 'DeviceType', 'ExposureLevel', 'IPInterfaces',
    'IsAzureADJoined', 'IsManaged', 'JoinType', 'LoggedOnUsers',
    'MacAddresses', 'MachineGroup', 'MergedDeviceIds', 'MergedToDeviceId',
    'OSArchitecture', 'OSBuild', 'OSDistribution', 'OSPlatform',
    'OSVersion', 'OSVersionInfo', 'OnboardingStatus', 'PublicIP',
    'ReportId', 'SensorHealthState', 'Timestamp',
  ],

  DeviceNetworkInfo: [
    'TimeGenerated', 'ConnectedNetworks', 'DefaultGateways', 'DeviceId',
    'DeviceName', 'DnsAddresses', 'IPAddresses', 'MacAddress',
    'MachineGroup', 'NetworkAdapterName', 'NetworkAdapterStatus',
    'NetworkAdapterType', 'ReportId', 'TunnelType', 'Timestamp',
  ],

  AlertInfo: [
    'TimeGenerated', 'AlertId', 'AttackTechniques', 'Category', 'Description',
    'DetectionSource', 'ProviderAlertId', 'ServiceSource', 'Severity',
    'Title', 'Timestamp',
  ],

  AlertEvidence: [
    'TimeGenerated', 'AccountDomain', 'AccountName', 'AccountObjectId',
    'AccountSid', 'AccountUpn', 'AdditionalFields', 'AlertId',
    'Application', 'DeviceId', 'DeviceName', 'EmailClusterId',
    'EmailDirection', 'EmailLanguage', 'EmailMessageId', 'EmailRecipient',
    'EmailSender', 'EmailSenderDisplayName', 'EmailSenderFromAddress',
    'EmailServerHost', 'EmailSubject', 'EvidenceDirection', 'EvidenceRole',
    'FileName', 'FileSize', 'FolderPath', 'LocalIP', 'LocalPort',
    'NetworkMessageId', 'OSPlatform', 'RemoteIP', 'RemotePort',
    'RemoteUrl', 'RegistryKey', 'RegistryValueData', 'RegistryValueName',
    'ReportId', 'SHA1', 'SHA256', 'ServiceSource', 'Timestamp',
  ],

  // ── Email ─────────────────────────────────────────────────────────────────
  EmailEvents: [
    'TimeGenerated', 'AttachmentCount', 'AuthenticationDetails',
    'BulkComplaintLevel', 'ConfidenceLevel', 'Connectors',
    'DeliveryAction', 'DeliveryLocation', 'DetectionMethods',
    'EmailAction', 'EmailActionPolicy', 'EmailActionPolicyGuid',
    'EmailClusterId', 'EmailDirection', 'EmailLanguage',
    'InternetMessageId', 'LatestDeliveryAction', 'LatestDeliveryLocation',
    'NetworkMessageId', 'OrgLevelAction', 'OrgLevelPolicy',
    'PhishFilterVerdict', 'PhishingConfidenceLevel', 'RecipientEmailAddress',
    'RecipientObjectId', 'ReportId', 'SenderDisplayName',
    'SenderFromAddress', 'SenderFromDomain', 'SenderIPv4', 'SenderIPv6',
    'SenderMailFromAddress', 'SenderMailFromDomain', 'SenderObjectId',
    'SpamFilterVerdict', 'SpamScore', 'Subject', 'Timestamp',
    'ThreatNames', 'ThreatTypes', 'UrlCount', 'UserLevelAction', 'UserLevelPolicy',
  ],

  EmailAttachmentInfo: [
    'TimeGenerated', 'DetectionMethods', 'FileName', 'FileSize',
    'FileType', 'MalwareFamily', 'NetworkMessageId', 'ReportId',
    'SHA256', 'SenderFromAddress', 'RecipientEmailAddress',
    'ThreatNames', 'ThreatTypes', 'Timestamp',
  ],

  EmailUrlInfo: [
    'TimeGenerated', 'NetworkMessageId', 'ReportId', 'Timestamp',
    'Url', 'UrlDomain', 'UrlLocation',
  ],

  EmailPostDeliveryEvents: [
    'TimeGenerated', 'Action', 'ActionResult', 'ActionTrigger',
    'ActionType', 'DeliveryLocation', 'NetworkMessageId',
    'RecipientEmailAddress', 'ReportId', 'Timestamp', 'ThreatTypes',
  ],

  // ── Cloud App Security ─────────────────────────────────────────────────────
  CloudAppEvents: [
    'TimeGenerated', 'AccountDisplayName', 'AccountId', 'AccountObjectId',
    'AccountType', 'ActionType', 'ActivityObjects', 'ActivityType',
    'AdditionalFields', 'AppId', 'AppInstanceId', 'Application',
    'City', 'CountryCode', 'DeviceType', 'IPAddress', 'IPCategory',
    'IPTags', 'IsAdminOperation', 'IsAnonymousProxy', 'IsExternalUser',
    'IsImpersonated', 'ISP', 'MergedDeviceIds', 'ObjectId', 'ObjectName',
    'ObjectType', 'OSPlatform', 'RawEventData', 'ReportId',
    'SensitivityLabelId', 'Timestamp', 'UserAgent',
    'UserAgentTags',
  ],

  // ── Threat Intelligence ────────────────────────────────────────────────────
  ThreatIntelligenceIndicator: [
    'TimeGenerated', 'Action', 'Active', 'AdditionalInformation',
    'AzureTenantId', 'Confidence', 'Description', 'DiamondModel',
    'DomainName', 'EmailEncoding', 'EmailLanguage', 'EmailRecipient',
    'EmailSenderAddress', 'EmailSenderName', 'EmailSourceDomain',
    'EmailSourceIpAddress', 'EmailSubject', 'EmailXMailer', 'ExpirationDateTime',
    'ExternalIndicatorId', 'FileCompileDateTime', 'FileCreatedDateTime',
    'FileHashType', 'FileHashValue', 'FileMutexName', 'FileName',
    'FilePacker', 'FilePath', 'FileSize', 'FileType',
    'IndicatorId', 'KillChainActions', 'MalwareFamilyNames',
    'NetworkCidrBlock', 'NetworkDestinationAsn', 'NetworkDestinationCidrBlock',
    'NetworkDestinationIPv4', 'NetworkDestinationIPv6', 'NetworkDestinationPort',
    'NetworkIPv4', 'NetworkIPv6', 'NetworkPort', 'NetworkProtocol',
    'NetworkSourceAsn', 'NetworkSourceCidrBlock', 'NetworkSourceIPv4',
    'NetworkSourceIPv6', 'NetworkSourcePort', 'NetworkType',
    'NetworkUrl', 'PassiveOnly', 'Severity', 'Tags', 'ThreatType',
    'Tlp', 'TrafficLightProtocolLevel', 'Type', 'Url', 'UserAgent',
  ],

  // ── DNS ───────────────────────────────────────────────────────────────────
  DnsEvents: [
    'TimeGenerated', 'ClientIP', 'Computer', 'DnsQueryType', 'EventId',
    'IPAddresses', 'Message', 'Name', 'QueryName', 'QueryResults',
    'QueryType', 'RemoteIPCountry', 'ResponseCode', 'ResponseCodeName',
    'ServerIP', 'ServerPort', 'SourceSystem', 'SubType', 'Type',
  ],

  // ── Cloud Storage ─────────────────────────────────────────────────────────
  StorageBlobLogs: [
    'TimeGenerated', 'AccountName', 'AuthenticationType', 'AuthorizationDetails',
    'Category', 'CallerIpAddress', 'ConditionsUsed', 'ContentLengthHeader',
    'DurationMs', 'Etag', 'LastModifiedTime', 'MetricResponseType',
    'OperationCount', 'OperationName', 'Protocol', 'RequestBodySize',
    'RequestHeaderSize', 'RequestMd5', 'RequestedObjectKey',
    'RequesterAppId', 'RequesterObjectId', 'RequesterTenantId',
    'RequesterUpn', 'ResponseBodySize', 'ResponseHeaderSize',
    'ResponseMd5', 'SasExpiryStatus', 'SchemaVersion', 'ServerLatencyMs',
    'ServiceType', 'StatusCode', 'StatusText', 'TlsVersion',
    'TransactionId', 'Uri', 'UserAgentHeader',
  ],

  // ── Key Vault ─────────────────────────────────────────────────────────────
  KeyVaultData: [
    'TimeGenerated', 'CallerIpAddress', 'DurationMs', 'HttpStatusCode',
    'Id', 'Identity', 'IsAddressAuthorized', 'KeyVaultName',
    'ManagedHsmSystemEventType', 'OperationName', 'OperationVersion',
    'Properties', 'RequestId', 'RequestUri', 'ResourceId',
    'ResourceType', 'ResultDescription', 'ResultSignature', 'ResultType',
    'SubnetId', 'TenantId', 'Tlv',
  ],

  // ── AWS ───────────────────────────────────────────────────────────────────
  AWSCloudTrail: [
    'TimeGenerated', 'AdditionalEventData', 'ApiVersion', 'AWSRegion',
    'AWSServices', 'ErrorCode', 'ErrorMessage', 'EventId', 'EventName',
    'EventSource', 'EventTypeName', 'EventVersion', 'ManagementEvent',
    'ReadOnly', 'RecipientAccountId', 'RequestParameters', 'Resources',
    'ResponseElements', 'ServiceEventDetails', 'SessionCredentialFromConsole',
    'SessionIssuerAccountId', 'SessionIssuerArn', 'SessionIssuerPrincipalId',
    'SessionIssuerType', 'SessionIssuerUserName', 'SessionMfaAuthenticated',
    'SharedEventId', 'SourceIpAddress', 'TlsDetails', 'UserAgent',
    'UserIdentityAccessKeyId', 'UserIdentityAccountId', 'UserIdentityArn',
    'UserIdentityInvokedBy', 'UserIdentityPrincipalid', 'UserIdentityType',
    'UserIdentityUserName', 'VpcEndpointId',
  ],

  // ── Azure Firewall ────────────────────────────────────────────────────────
  AzureFirewallApplicationRule: [
    'TimeGenerated', 'Action', 'ActionReason', 'Category', 'Fqdn',
    'IsTlsInspected', 'Msg', 'Policy', 'Protocol', 'ResourceId',
    'RuleCollection', 'RuleCollectionGroup', 'RuleName',
    'SourceIp', 'SourcePort', 'TargetUrl', 'ThreatIntelCategory',
    'TranslatedIp', 'TranslatedPort', 'WebCategory',
  ],

  AzureFirewallNetworkRule: [
    'TimeGenerated', 'Action', 'ActionReason', 'Category', 'DestinationIp',
    'DestinationPort', 'Msg', 'Policy', 'Protocol', 'ResourceId',
    'RuleCollection', 'RuleCollectionGroup', 'RuleName', 'SourceIp',
    'SourcePort', 'ThreatIntelCategory', 'TranslatedDestinationIp',
    'TranslatedDestinationPort',
  ],

  // ── IIS ───────────────────────────────────────────────────────────────────
  W3CIISLog: [
    'TimeGenerated', 'cIP', 'cPort', 'ComputerName', 'csBytes', 'csHost',
    'csMethod', 'csReferer', 'csUriQuery', 'csUriStem', 'csUserAgent',
    'csUserName', 'csVersion', 'sSiteName', 'scBytes', 'scStatus',
    'scSubStatus', 'scWin32Status', 'sComputerName', 'sIP',
    'sPort', 'TimeTaken',
  ],

  // ── Network Access ────────────────────────────────────────────────────────
  NetworkAccessTraffic: [
    'TimeGenerated', 'Action', 'DestinationFQDN', 'DestinationIp',
    'DestinationPort', 'DestinationWebCategory', 'OperationName',
    'PolicyId', 'PolicyName', 'PolicyRuleId', 'PolicyRuleName',
    'Protocol', 'ResourceId', 'ResponseCode', 'SourceIp', 'SourcePort',
    'TenantId', 'TrafficType', 'TransactionId', 'TransportProtocol',
    'UserAgent', 'UserId', 'UserPrincipalName',
  ],
}

// ── KQL Operators & Functions ─────────────────────────────────────────────────

const KQL_OPERATORS = [
  'where', 'summarize', 'project', 'project-away', 'project-rename',
  'extend', 'join', 'union', 'count', 'distinct', 'top', 'sort',
  'order by', 'limit', 'take', 'sample', 'parse', 'parse-where',
  'extract', 'mv-expand', 'mv-apply', 'evaluate', 'render', 'print',
  'let', 'datatable', 'range', 'make-series', 'find', 'search',
  'reduce', 'partition', 'fork', 'facet', 'as',
]

const KQL_FUNCTIONS = [
  // Time
  'ago()', 'now()', 'bin()', 'startofday()', 'endofday()',
  'startofweek()', 'endofweek()', 'startofmonth()', 'endofmonth()',
  'startofyear()', 'endofyear()', 'datetime()', 'todatetime()',
  'datetime_add()', 'datetime_diff()', 'dayofmonth()', 'dayofweek()',
  'dayofyear()', 'hourofday()', 'weekofyear()',
  // String
  'tostring()', 'strlen()', 'strcat()', 'strcat_delim()', 'split()',
  'trim()', 'trim_start()', 'trim_end()', 'replace()', 'replace_string()',
  'replace_regex()', 'tolower()', 'toupper()', 'substring()',
  'indexof()', 'indexof_regex()', 'countof()', 'extract()',
  'extract_all()', 'parse_url()', 'parse_urlquery()',
  // Numeric
  'toint()', 'tolong()', 'todouble()', 'toreal()', 'abs()',
  'floor()', 'ceiling()', 'round()', 'log()', 'log2()', 'log10()',
  'pow()', 'sqrt()', 'exp()',
  // Aggregation
  'count()', 'countif()', 'dcount()', 'dcountif()', 'sum()', 'sumif()',
  'avg()', 'avgif()', 'min()', 'max()', 'minif()', 'maxif()',
  'arg_max()', 'arg_min()', 'make_list()', 'make_list_if()',
  'make_set()', 'make_set_if()', 'percentile()', 'percentiles()',
  'stdev()', 'stdevif()', 'variance()', 'varianceif()',
  'any()', 'anyif()',
  // Conditional
  'iif()', 'iff()', 'case()', 'coalesce()', 'isempty()', 'isnotempty()',
  'isnull()', 'isnotnull()', 'isfuzzy()',
  // JSON / Dynamic
  'parse_json()', 'todynamic()', 'bag_keys()', 'bag_merge()',
  'bag_pack()', 'bag_remove_keys()', 'pack()', 'pack_array()',
  'array_length()', 'array_index_of()', 'array_slice()',
  'array_concat()', 'array_iif()', 'array_sum()',
  'zip()', 'set_intersect()', 'set_union()', 'set_difference()',
  // IP
  'ipv4_is_private()', 'ipv4_compare()', 'ipv4_is_match()',
  'ipv4_is_in_range()', 'ipv4_is_in_any_range()',
  'ipv6_compare()', 'ipv6_is_match()',
  'geo_info_from_ip_address()',
  // Hash / Encoding
  'hash()', 'hash_md5()', 'hash_sha256()', 'hash_sha512()',
  'base64_encode_tostring()', 'base64_decode_tostring()',
  // Type checking
  'gettype()', 'typeof()',
]

// ── Register completion provider ──────────────────────────────────────────────

export function registerKqlCompletions(monaco: typeof Monaco) {
  // Register kusto as a language if Monaco doesn't know about it yet
  const registered = monaco.languages.getLanguages().some((l) => l.id === 'kusto')
  if (!registered) {
    monaco.languages.register({ id: 'kusto', extensions: ['.kql', '.kusto'] })
  }

  monaco.languages.registerCompletionItemProvider('kusto', {
    triggerCharacters: ['|', ' ', '\n', '.'],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const suggestions: Monaco.languages.CompletionItem[] = []
      const queryText = model.getValue()

      // Tables
      for (const table of Object.keys(SENTINEL_SCHEMA)) {
        suggestions.push({
          label: table,
          kind: monaco.languages.CompletionItemKind.Class,
          detail: 'Sentinel Table',
          documentation: `Columns: ${SENTINEL_SCHEMA[table].slice(0, 5).join(', ')}...`,
          insertText: table,
          range,
        })
      }

      // Columns for tables already referenced in the query
      for (const [table, columns] of Object.entries(SENTINEL_SCHEMA)) {
        if (queryText.includes(table)) {
          for (const col of columns) {
            suggestions.push({
              label: col,
              kind: monaco.languages.CompletionItemKind.Field,
              detail: `${table} column`,
              insertText: col,
              sortText: `0_${col}`, // surface columns first when table is in query
              range,
            })
          }
        }
      }

      // Operators
      for (const op of KQL_OPERATORS) {
        suggestions.push({
          label: op,
          kind: monaco.languages.CompletionItemKind.Keyword,
          detail: 'KQL Operator',
          insertText: op,
          range,
        })
      }

      // Functions
      for (const fn of KQL_FUNCTIONS) {
        suggestions.push({
          label: fn,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: 'KQL Function',
          insertText: fn.endsWith('()') ? fn.slice(0, -1) : fn, // position cursor inside parens
          insertTextRules: fn.endsWith('()')
            ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          range,
        })
      }

      return { suggestions }
    },
  })
}
