const REQUIRED_FIELDS = [
    'deptCode',
    'integrationKey',
    'integrationPassword',
    'appGuid',
    'applicationId',
    'userId',
    'responseRedirectURL',
    'applicationRedirectURL',
    'ENCRYPT_RESPONSE_URL',
     'REMOTE_URL'

  ];
  
  export const validateEKYCConfig = (config = {}) => {
    const missingFields = REQUIRED_FIELDS.filter((key) => !config[key]);
  
    if (missingFields.length > 0) {
      return {
        valid: false,
        missing: missingFields,
        message: `Missing required config field(s): ${missingFields.join(', ')}`,
      };
    }
  
    return {
      valid: true,
      missing: [],
      message: '',
    };
  };
  