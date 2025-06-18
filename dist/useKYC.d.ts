import 'react-native-get-random-values';
declare const useEKYC: (userConfig?: {}) => {
    htmlContent: string;
    handleSubmit: () => Promise<void>;
    remoteUrl: string;
    encDecValue: string;
    loader: boolean;
};
export default useEKYC;
