import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { useSignIn, useSignUp, useOAuth } from '@clerk/expo';
import { Eye, EyeOff, Lock, Mail, CheckCircle2 } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Svg, { Path } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Google Sign In
  const onGoogleSignInPress = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'frontend' }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow]);

  // Handle standard user Sign In
  const onSignInPress = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (res.error) {
        setError(res.error.message || 'An error occurred during sign in.');
        return;
      }

      if (signIn.status === 'complete') {
        const finalizeRes = await signIn.finalize();
        if (finalizeRes.error) {
          setError(finalizeRes.error.message || 'Failed to finalize session.');
        }
      } else {
        setError(`Sign in status: ${signIn.status}. Unhandled sign in factor required.`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Handle starting the Sign Up process
  const onSignUpPress = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await signUp.create({
        emailAddress,
        password,
      });

      if (res.error) {
        setError(res.error.message || 'An error occurred during sign up.');
        return;
      }

      // Send verification email
      const verifySendRes = await signUp.verifications.sendEmailCode();
      if (verifySendRes.error) {
        setError(verifySendRes.error.message || 'Failed to send verification code.');
        return;
      }

      setPendingVerification(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  // Handle completing verification
  const onVerifyPress = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });

      if (res.error) {
        setError(res.error.message || 'Verification failed. Please check the code.');
        return;
      }

      if (signUp.status === 'complete') {
        const finalizeRes = await signUp.finalize();
        if (finalizeRes.error) {
          setError(finalizeRes.error.message || 'Failed to finalize session.');
        }
      } else {
        setError(`Sign up status: ${signUp.status}. Expected complete status.`);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/financial_wise.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <SafeAreaView style={styles.safeContainer}>
            <View style={styles.innerContainer}>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <Text style={styles.logoLabel}>THE BUDGING</Text>
                <Text style={styles.headerTitle}>
                  {pendingVerification
                    ? 'Verify Email'
                    : isSignUpMode
                    ? 'Create Account'
                    : 'Welcome Back'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {pendingVerification
                    ? 'Enter the code sent to your inbox'
                    : isSignUpMode
                    ? 'Start managing your 25-to-25 fiscal cycle'
                    : 'Secure access to your Command Center'}
                </Text>
              </View>

              {/* Floating Form Card */}
              <View style={styles.cardContainer}>
                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Form Content */}
                {!pendingVerification ? (
                  // Sign In / Sign Up Form
                  <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                    <View style={styles.inputWrapper}>
                      <Mail size={18} color="#8e8e93" style={styles.inputIcon} />
                      <TextInput
                        autoCapitalize="none"
                        value={emailAddress}
                        placeholder="name@example.com"
                        placeholderTextColor="#a2a2a7"
                        style={styles.textInput}
                        onChangeText={(val) => setEmailAddress(val)}
                        keyboardType="email-address"
                      />
                    </View>

                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <View style={styles.inputWrapper}>
                      <Lock size={18} color="#8e8e93" style={styles.inputIcon} />
                      <TextInput
                        value={password}
                        placeholder="••••••••"
                        placeholderTextColor="#a2a2a7"
                        style={styles.textInput}
                        secureTextEntry={!showPassword}
                        onChangeText={(val) => setPassword(val)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        {showPassword ? (
                          <EyeOff size={18} color="#8e8e93" />
                        ) : (
                          <Eye size={18} color="#8e8e93" />
                        )}
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={isSignUpMode ? onSignUpPress : onSignInPress}
                      disabled={loading}
                      style={styles.primaryButton}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {isSignUpMode ? 'Sign Up' : 'Sign In'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OR</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Google OAuth Button */}
                    <TouchableOpacity
                      onPress={onGoogleSignInPress}
                      disabled={loading}
                      style={styles.googleButton}
                    >
                      <View style={styles.googleIconContainer}>
                        <Svg width={18} height={18} viewBox="0 0 24 24">
                          <Path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <Path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <Path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.08-.22-.14-.43-.19-.63z"
                          />
                          <Path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </Svg>
                      </View>
                      <Text style={styles.googleButtonText}>
                        {isSignUpMode ? 'Sign up with Google' : 'Sign in with Google'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setIsSignUpMode(!isSignUpMode);
                        setError('');
                      }}
                      style={styles.switchButton}
                    >
                      <Text style={styles.switchButtonText}>
                        {isSignUpMode
                          ? 'Already have an account? Sign In'
                          : "Don't have an account? Sign Up"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Verification Code Form (for SignUp)
                  <View style={styles.formContainer}>
                    <View style={styles.infoWrapper}>
                      <CheckCircle2 size={24} color="#000" style={styles.infoIcon} />
                      <Text style={styles.infoText}>
                        We sent a 6-digit verification code to {emailAddress}. Please enter it below.
                      </Text>
                    </View>

                    <Text style={styles.inputLabel}>VERIFICATION CODE</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        value={verificationCode}
                        placeholder="123456"
                        placeholderTextColor="#a2a2a7"
                        style={[styles.textInput, styles.codeFormat]}
                        onChangeText={(val) => setVerificationCode(val)}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={onVerifyPress}
                      disabled={loading}
                      style={styles.primaryButton}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Verify & Log In</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setPendingVerification(false);
                        setError('');
                      }}
                      style={styles.switchButton}
                    >
                      <Text style={styles.switchButtonText}>Back to Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)', // Premium dark translucent overlay
  },
  safeContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Center vertically
  },
  innerContainer: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center', // Center content horizontally
  },
  headerSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center', // Center header text
  },
  logoLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 8,
    opacity: 0.8,
    textAlign: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#e5e5ea',
    lineHeight: 20,
    opacity: 0.9,
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: 'transparent', // Clear card container
    width: '100%',
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: 'transparent', // Remove shadow
    elevation: 0,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 229, 229, 0.9)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffb3b3',
  },
  errorText: {
    fontFamily: 'Inter',
    color: '#cc0000',
    fontSize: 13,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#fff', // White text for contrast on dark background
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#1c1c1e',
  },
  codeFormat: {
    fontFamily: 'JetBrainsMono-Bold',
    letterSpacing: 6,
    textAlign: 'center',
    fontSize: 18,
  },
  eyeBtn: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: '#000',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'JetBrainsMono-Bold',
    color: '#fff',
    fontSize: 15,
    letterSpacing: 1.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Translucent divider line
  },
  dividerText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
    color: '#e5e5ea', // Lighter text
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d1d6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIconContainer: {
    marginRight: 10,
  },
  googleButtonText: {
    fontFamily: 'JetBrainsMono-Bold',
    color: '#1c1c1e',
    fontSize: 15,
    letterSpacing: 1,
  },
  switchButton: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchButtonText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#fff', // White text for contrast
    fontWeight: '500',
    textAlign: 'center',
  },
  infoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 245, 233, 0.9)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Inter',
    color: '#2e7d32',
    fontSize: 13,
    lineHeight: 18,
  },
});
