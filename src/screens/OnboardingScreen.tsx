import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const SEX_OPTIONS = ['male', 'female', 'intersex', 'prefer_not_to_answer'];

type AuthAction = 'signin' | 'signup';

export default function OnboardingScreen() {
  const { login, register } = useAuth();
  const [action, setAction] = useState<AuthAction>('signin');
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('male');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (mode === 'email' && !email.trim()) {
      Alert.alert('Please enter your email');
      return;
    }
    if (mode === 'phone' && !phone.trim()) {
      Alert.alert('Please enter your phone number');
      return;
    }
    if (!password || password.length < 8) {
      Alert.alert('Password must be at least 8 characters');
      return;
    }

    // Extra fields only required to create an account
    if (action === 'signup') {
      if (!age || isNaN(Number(age))) {
        Alert.alert('Please enter your age');
        return;
      }
      if (!location.trim()) {
        Alert.alert('Please enter your location');
        return;
      }
    }

    setLoading(true);
    try {
      if (action === 'signin') {
        await login(
          mode === 'email' ? email : undefined,
          mode === 'phone' ? phone : undefined,
          password,
        );
      } else {
        await register({
          email: mode === 'email' ? email : undefined,
          phone: mode === 'phone' ? phone : undefined,
          password,
          age: Number(age),
          sex_assigned_at_birth: sex,
          location_text: location,
        });
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      Alert.alert(
        action === 'signin' ? 'Sign-in failed' : 'Sign-up failed',
        detail || 'Please check your details and try again',
      );
    } finally {
      setLoading(false);
    }
  };

  const isSignup = action === 'signup';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LinkRTC</Text>
      <Text style={styles.subtitle}>Find clinical trials that may be relevant to you</Text>

      {/* Disclaimer — informational matching, not medical advice */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          This is informational matching, not medical advice. It does not diagnose,
          treat, or tell you to join any study. Talk to your doctor or the study team
          before acting.
        </Text>
      </View>

      {/* Sign In / Create Account action toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggle, action === 'signin' && styles.toggleActive]}
          onPress={() => setAction('signin')}
          accessibilityRole="button"
          accessibilityLabel="Sign in to an existing account"
        >
          <Text style={[styles.toggleText, action === 'signin' && styles.toggleTextActive]}>
            Sign In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, action === 'signup' && styles.toggleActive]}
          onPress={() => setAction('signup')}
          accessibilityRole="button"
          accessibilityLabel="Create a new account"
        >
          <Text style={[styles.toggleText, action === 'signup' && styles.toggleTextActive]}>
            Create Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Email / phone mode toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleSm, mode === 'email' && styles.toggleActive]}
          onPress={() => setMode('email')}
        >
          <Text style={[styles.toggleText, mode === 'email' && styles.toggleTextActive]}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleSm, mode === 'phone' && styles.toggleActive]}
          onPress={() => setMode('phone')}
        >
          <Text style={[styles.toggleText, mode === 'phone' && styles.toggleTextActive]}>Phone</Text>
        </TouchableOpacity>
      </View>

      {mode === 'email' ? (
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Password (min 8 chars)"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Account-creation-only fields */}
      {isSignup && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Age"
            placeholderTextColor="#999"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Sex assigned at birth</Text>
          <View style={styles.toggleRow}>
            {SEX_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, sex === s && styles.chipActive]}
                onPress={() => setSex(s)}
              >
                <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
                  {s === 'prefer_not_to_answer' ? 'N/A' : s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Location (city, state or ZIP)"
            placeholderTextColor="#999"
            value={location}
            onChangeText={setLocation}
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading
            ? (isSignup ? 'Creating...' : 'Signing in...')
            : (isSignup ? 'Create Account' : 'Sign In')}
        </Text>
      </TouchableOpacity>

      {!isSignup && (
        <Text style={styles.hint}>
          New here? Tap “Create Account” above to get started.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 20, color: '#0F7B7B' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4, marginBottom: 20 },
  disclaimerBox: {
    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 20,
    borderLeftWidth: 4, borderLeftColor: '#FFC107',
  },
  disclaimerText: { fontSize: 13, color: '#795548', lineHeight: 18 },
  toggleRow: { flexDirection: 'row', marginBottom: 16, gap: 8, flexWrap: 'wrap' },
  toggle: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  toggleSm: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  toggleActive: { borderColor: '#0F7B7B', backgroundColor: '#E0F7F7' },
  toggleText: { fontSize: 15, color: '#666' },
  toggleTextActive: { color: '#0F7B7B', fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14,
    fontSize: 16, marginBottom: 14, color: '#333',
  },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#333' },
  chip: { padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 6 },
  chipActive: { borderColor: '#0F7B7B', backgroundColor: '#E0F7F7' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextActive: { color: '#0F7B7B', fontWeight: '600' },
  button: {
    backgroundColor: '#0F7B7B', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 10, minHeight: 50,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  hint: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 16 },
});
