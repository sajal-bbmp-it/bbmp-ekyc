import React from 'react';
import { RouteProp } from '@react-navigation/native';
type EKYCParams = {
    htmlContent: string;
    loader: boolean;
    remoteUrl: string;
    encDecValue: string;
    ekycIndex?: number;
};
type EKYCFormProps = {
    route: RouteProp<{
        params: EKYCParams;
    }, 'params'>;
};
declare const EKYCForm: React.FC<EKYCFormProps>;
export default EKYCForm;
