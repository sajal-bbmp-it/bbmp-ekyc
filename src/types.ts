export interface EKYCConfig {
    deptCode?: string;
    integrationKey?: string;
    integrationPassword?: string;
    appGuid?: string;
    applicationId?: string;
    userId?: string;
    responseRedirectURL?: string;
    applicationRedirectURL?: string;
    ENCRYPT_RESPONSE_URL?: string;
    REMOTE_URL?: string;
    encDecType?: string;
  }
  
  export interface ValidationResult {
    valid: boolean;
    message?: string;
  }
  